import { HttpTestClient } from '../../http/HttpTestClient';
import { ValidationService } from './ValidationService';
import { AuthenticationService } from './AuthenticationService';
import {
  BatchTestRequest,
  BatchTestResult,
  BatchTestOptions,
  BatchTestReport,
  BatchTestRequestSchema,
  BatchTestOptionsSchema
} from '../../types/batch';
import { z } from 'zod';

export class BatchTestService {
  private httpClient: HttpTestClient;
  private validationService: ValidationService;
  private authService: AuthenticationService;
  private abortController: AbortController | null = null;

  constructor(httpClient?: HttpTestClient) {
    this.httpClient = httpClient || new HttpTestClient();
    this.validationService = new ValidationService();
    this.authService = new AuthenticationService();
  }

  /**
   * Execute a batch of tests
   */
  async executeBatch(
    tests: BatchTestRequest[],
    options: BatchTestOptions = {}
  ): Promise<BatchTestReport> {
    // Validate inputs
    const validatedTests = tests.map(test => BatchTestRequestSchema.parse(test));
    const validatedOptions = BatchTestOptionsSchema.parse(options);

    // Set defaults
    const opts: Required<BatchTestOptions> = {
      parallel: validatedOptions.parallel ?? false,
      maxConcurrent: validatedOptions.maxConcurrent ?? 5,
      stopOnFailure: validatedOptions.stopOnFailure ?? false,
      delayBetween: validatedOptions.delayBetween ?? 0,
      timeout: validatedOptions.timeout ?? 30000,
      retryOnFailure: validatedOptions.retryOnFailure ?? false,
      retryAttempts: validatedOptions.retryAttempts ?? 0
    };

    // Initialize report
    const startTime = new Date();
    const results: BatchTestResult[] = [];
    let stopped = false;

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    try {
      if (opts.parallel) {
        // Execute tests in parallel with concurrency limit
        await this.executeParallel(validatedTests, opts, results);
      } else {
        // Execute tests sequentially
        stopped = await this.executeSequential(validatedTests, opts, results);
      }
    } catch (error) {
      console.error('Batch execution error:', error);
    } finally {
      this.abortController = null;
    }

    // Generate report
    const endTime = new Date();
    return this.generateReport(startTime, endTime, results, stopped);
  }

  /**
   * Execute tests sequentially
   */
  private async executeSequential(
    tests: BatchTestRequest[],
    options: Required<BatchTestOptions>,
    results: BatchTestResult[]
  ): Promise<boolean> {
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];

      // Check if aborted
      if (this.abortController?.signal.aborted) {
        break;
      }

      // Apply delay
      if (i > 0 && options.delayBetween > 0) {
        await this.delay(options.delayBetween);
      }
      if (test.delay) {
        await this.delay(test.delay);
      }

      // Execute test
      const result = await this.executeTest(test, options);
      results.push(result);

      // Check stop on failure
      if (options.stopOnFailure && !result.success) {
        return true; // Stopped due to failure
      }
    }
    return false; // Not stopped
  }

  /**
   * Execute tests in parallel with concurrency control
   */
  private async executeParallel(
    tests: BatchTestRequest[],
    options: Required<BatchTestOptions>,
    results: BatchTestResult[]
  ): Promise<void> {
    const executing: Promise<void>[] = [];
    const queue = [...tests];

    // Process queue with concurrency limit
    while (queue.length > 0 || executing.length > 0) {
      // Check if aborted
      if (this.abortController?.signal.aborted) {
        break;
      }

      // Start new tests up to concurrency limit
      while (executing.length < options.maxConcurrent && queue.length > 0) {
        const test = queue.shift()!;
        
        const promise = this.executeTest(test, options)
          .then(result => {
            results.push(result);
            
            // Check stop on failure
            if (options.stopOnFailure && !result.success) {
              this.abort();
            }
          })
          .then(() => {
            // Remove from executing
            const index = executing.indexOf(promise);
            if (index > -1) {
              executing.splice(index, 1);
            }
          });

        executing.push(promise);

        // Apply delay between starting requests
        if (options.delayBetween > 0 && queue.length > 0) {
          await this.delay(options.delayBetween);
        }
      }

      // Wait for at least one to complete
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    // Wait for all remaining to complete
    await Promise.all(executing);
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    test: BatchTestRequest,
    options: Required<BatchTestOptions>
  ): Promise<BatchTestResult> {
    const startTime = Date.now();
    const method = test.method || 'GET';

    try {
      // Set authentication if provided
      const previousAuth = test.auth ? this.httpClient.getAuth() : null;
      if (test.auth) {
        this.httpClient.setAuth(test.auth);
      }

      try {
        // Prepare request config
        const config: any = {
          headers: test.headers || {},
          params: test.params || {},
          timeout: options.timeout,
          signal: this.abortController?.signal
        };

        // Execute request with retry logic
        let response: any;
        let lastError: any;
        let attempts = 0;
        const maxAttempts = options.retryOnFailure ? (options.retryAttempts + 1) : 1;

        while (attempts < maxAttempts) {
          attempts++;
          
          try {
            response = await this.executeHttpRequest(method, test.url, test.body, config);
            break; // Success, exit retry loop
          } catch (error: any) {
            lastError = error;
            
            // Don't retry on abort
            if (this.abortController?.signal.aborted) {
              throw error;
            }
            
            // Check if we should retry
            if (attempts < maxAttempts) {
              await this.delay(1000 * attempts); // Exponential backoff
              continue;
            }
            
            throw error;
          }
        }

        // Run assertions if provided
        let assertionSummary = undefined;
        if (test.assertions && test.assertions.length > 0 && response) {
          const validationReport = await this.validationService.validateAssertions(
            response,
            test.assertions
          );
          
          assertionSummary = {
            passed: validationReport.passedAssertions,
            failed: validationReport.failedAssertions,
            total: validationReport.totalAssertions
          };
        }

        return {
          name: test.name,
          url: test.url,
          method,
          success: true,
          status: response?.status,
          statusText: response?.statusText,
          duration: Date.now() - startTime,
          assertionResults: assertionSummary
        };

      } finally {
        // Restore previous auth
        if (test.auth) {
          if (previousAuth) {
            this.httpClient.setAuth(previousAuth);
          } else {
            this.httpClient.clearAuthToken();
          }
        }
      }

    } catch (error: any) {
      // Handle errors
      const isHttpError = error.response !== undefined;
      
      return {
        name: test.name,
        url: test.url,
        method,
        success: false,
        status: isHttpError ? error.response?.status : undefined,
        statusText: isHttpError ? error.response?.statusText : undefined,
        duration: Date.now() - startTime,
        error: error.message || 'Request failed'
      };
    }
  }

  /**
   * Execute HTTP request based on method
   */
  private async executeHttpRequest(
    method: string,
    url: string,
    body: any,
    config: any
  ): Promise<any> {
    const lowerMethod = method.toLowerCase();
    
    switch (lowerMethod) {
      case 'get':
        return await this.httpClient.get(url, config);
      case 'post':
        return await this.httpClient.post(url, body, config);
      case 'put':
        return await this.httpClient.put(url, body, config);
      case 'delete':
        return await this.httpClient.delete(url, config);
      case 'patch':
        return await this.httpClient.patch(url, body, config);
      case 'head':
        return await this.httpClient.head(url, config);
      case 'options':
        return await this.httpClient.options(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Generate batch test report
   */
  private generateReport(
    startTime: Date,
    endTime: Date,
    results: BatchTestResult[],
    stopped: boolean
  ): BatchTestReport {
    const totalDuration = endTime.getTime() - startTime.getTime();
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    // Calculate durations
    const durations = results
      .filter(r => r.duration !== undefined)
      .map(r => r.duration!);
    
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    
    const minDuration = durations.length > 0
      ? Math.min(...durations)
      : 0;
    
    const maxDuration = durations.length > 0
      ? Math.max(...durations)
      : 0;

    // Calculate assertion totals
    let totalAssertions = 0;
    let passedAssertions = 0;
    let failedAssertions = 0;
    
    results.forEach(result => {
      if (result.assertionResults) {
        totalAssertions += result.assertionResults.total;
        passedAssertions += result.assertionResults.passed;
        failedAssertions += result.assertionResults.failed;
      }
    });

    return {
      startTime,
      endTime,
      totalDuration,
      totalTests: results.length,
      successfulTests,
      failedTests,
      results,
      summary: {
        successRate: results.length > 0 ? (successfulTests / results.length) * 100 : 0,
        averageDuration,
        minDuration,
        maxDuration,
        ...(totalAssertions > 0 && {
          totalAssertions,
          passedAssertions,
          failedAssertions
        })
      },
      stopped
    };
  }

  /**
   * Abort the current batch execution
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a batch test from a template
   */
  static createBatchFromTemplate(
    template: Partial<BatchTestRequest>,
    urls: { name: string; url: string; overrides?: Partial<BatchTestRequest> }[]
  ): BatchTestRequest[] {
    return urls.map(({ name, url, overrides }) => ({
      ...template,
      ...overrides,
      name,
      url
    } as BatchTestRequest));
  }
}