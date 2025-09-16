import { HttpTestClient } from '../../http/HttpTestClient.js';
import { ValidationService, Assertion } from '../../core/services/ValidationService.js';
import { z } from 'zod';

// Schema for the test_with_assertions tool
export const TestWithAssertionsSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).default('GET'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().positive().default(30000),
  auth: z.object({
    type: z.enum(['bearer', 'apikey', 'basic']),
    token: z.string().optional(),
    key: z.string().optional(),
    keyName: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  assertions: z.array(z.object({
    type: z.enum([
      'status', 'header', 'body', 'bodyJson', 'bodyJsonPath',
      'responseTime', 'contentType', 'contains', 'notContains', 'matches'
    ]),
    path: z.string().optional(),
    expected: z.any(),
    operator: z.enum(['equals', 'contains', 'lessThan', 'greaterThan', 'matches', 'exists']).optional(),
    message: z.string().optional(),
  })).optional(),
  retryAttempts: z.number().min(0).max(5).default(0),
  retryDelay: z.number().positive().default(1000),
  allowErrorStatus: z.boolean().optional().describe('If true, 4xx and 5xx status codes will not be treated as errors'),
});

export type TestWithAssertionsInput = z.infer<typeof TestWithAssertionsSchema>;

export interface TestWithAssertionsResult {
  success: boolean;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    metrics: {
      responseTime: string;
      size: string;
      retryCount?: number;
      totalDuration?: string;
    };
  };
  validation?: {
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
    overallPassed: boolean;
    results: Array<{
      assertion: string;
      passed: boolean;
      actual?: any;
      expected?: any;
      error?: string;
    }>;
  };
  retryInfo?: {
    attempts: number;
    maxAttempts: number;
    finalStatus?: number;
    totalDuration: string;
  };
  error?: string;
  timestamp: string;
  duration: string;
}

export class TestWithAssertions {
  private httpClient: HttpTestClient;
  private validationService: ValidationService;

  constructor() {
    this.httpClient = new HttpTestClient();
    this.validationService = new ValidationService();
  }

  async execute(input: TestWithAssertionsInput): Promise<TestWithAssertionsResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Validate input
      const validatedInput = TestWithAssertionsSchema.parse(input);

      // Configure HTTP client
      if (validatedInput.auth) {
        this.configureAuth(validatedInput.auth);
      }

      // Configure retries
      this.httpClient = new HttpTestClient({
        timeout: validatedInput.timeout,
        retryAttempts: validatedInput.retryAttempts,
        retryDelay: validatedInput.retryDelay,
      });

      // Execute HTTP request
      const response = await this.executeRequest(validatedInput);

      // Run assertions if provided
      let validationReport = null;
      if (validatedInput.assertions && validatedInput.assertions.length > 0) {
        validationReport = await this.validationService.validateAssertions(
          {
            status: response.status,
            headers: response.headers,
            data: response.data,
            metrics: response.metrics,
          },
          validatedInput.assertions as Assertion[]
        );
      }

      const duration = Date.now() - startTime;

      const result: TestWithAssertionsResult = {
        success: !validationReport || validationReport.overallPassed,
        request: {
          method: validatedInput.method,
          url: validatedInput.url,
          headers: validatedInput.headers,
          body: validatedInput.body,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.data,
          metrics: {
            responseTime: `${response.metrics.duration}ms`,
            size: `${response.metrics.responseSize} bytes`,
            retryCount: response.metrics.retryCount,
            totalDuration: response.metrics.totalDuration ? `${response.metrics.totalDuration}ms` : undefined,
          },
        },
        validation: validationReport ? {
          totalAssertions: validationReport.totalAssertions,
          passedAssertions: validationReport.passedAssertions,
          failedAssertions: validationReport.failedAssertions,
          overallPassed: validationReport.overallPassed,
          results: validationReport.results.map(r => ({
            assertion: r.assertion.message || `${r.assertion.type} assertion`,
            passed: r.passed,
            actual: r.actual,
            expected: r.assertion.expected,
            error: r.error,
          })),
        } : undefined,
        timestamp,
        duration: `${duration}ms`,
      };

      // Add retry info if retries were attempted
      if (response.metrics.retryCount && response.metrics.retryCount > 0) {
        result.retryInfo = {
          attempts: response.metrics.retryCount,
          maxAttempts: validatedInput.retryAttempts,
          finalStatus: response.status,
          totalDuration: `${response.metrics.totalDuration || duration}ms`,
        };
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result: TestWithAssertionsResult = {
        success: false,
        request: {
          method: input.method || 'GET',
          url: input.url,
          headers: input.headers,
          body: input.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
        duration: `${duration}ms`,
      };

      // Check if error has metrics (from retry attempts)
      if ((error as any).metrics) {
        const metrics = (error as any).metrics;
        if (metrics.retryCount && metrics.retryCount > 0) {
          result.retryInfo = {
            attempts: metrics.retryCount,
            maxAttempts: input.retryAttempts || 0,
            finalStatus: (error as any).response?.status,
            totalDuration: `${metrics.totalDuration || duration}ms`,
          };
          
          // Add additional context to error message
          result.error = `${result.error} (Retried ${metrics.retryCount} times over ${metrics.totalDuration || duration}ms)`;
        }
      }

      return result;
    }
  }

  private configureAuth(auth: TestWithAssertionsInput['auth']): void {
    if (!auth) return;

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          this.httpClient.setAuthToken(auth.token, 'Bearer');
        }
        break;
      case 'basic':
        if (auth.username && auth.password) {
          const basicAuth = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          this.httpClient.setAuthToken(basicAuth, 'Basic');
        }
        break;
      case 'apikey':
        if (auth.key) {
          this.httpClient.setDefaultHeaders({
            [auth.keyName || 'X-API-Key']: auth.key,
          });
        }
        break;
    }
  }

  private async executeRequest(input: TestWithAssertionsInput) {
    const config = {
      headers: input.headers,
    };

    switch (input.method) {
      case 'GET':
        return await this.httpClient.get(input.url, config);
      case 'POST':
        return await this.httpClient.post(input.url, input.body, config);
      case 'PUT':
        return await this.httpClient.put(input.url, input.body, config);
      case 'DELETE':
        return await this.httpClient.delete(input.url, config);
      case 'PATCH':
        return await this.httpClient.patch(input.url, input.body, config);
      case 'HEAD':
        return await this.httpClient.head(input.url, config);
      case 'OPTIONS':
        return await this.httpClient.options(input.url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${input.method}`);
    }
  }
}

// Tool definition for MCP server
export const testWithAssertionsToolDefinition = {
  name: 'test_with_assertions',
  description: 'Test an HTTP endpoint with assertions for validation',
  inputSchema: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        description: 'HTTP method to use',
        default: 'GET',
      },
      url: {
        type: 'string',
        description: 'Full URL to test (e.g., https://api.example.com/endpoint)',
      },
      headers: {
        type: 'object',
        description: 'HTTP headers as key-value pairs',
        additionalProperties: {
          type: 'string',
        },
      },
      body: {
        type: ['object', 'string', 'null'],
        description: 'Request body (for POST, PUT, PATCH)',
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 30000,
      },
      auth: {
        type: 'object',
        description: 'Authentication configuration',
        properties: {
          type: {
            type: 'string',
            enum: ['bearer', 'apikey', 'basic'],
            description: 'Authentication type',
          },
          token: {
            type: 'string',
            description: 'Bearer token (for bearer auth)',
          },
          key: {
            type: 'string',
            description: 'API key (for apikey auth)',
          },
          keyName: {
            type: 'string',
            description: 'Header name for API key (default: X-API-Key)',
          },
          username: {
            type: 'string',
            description: 'Username (for basic auth)',
          },
          password: {
            type: 'string',
            description: 'Password (for basic auth)',
          },
        },
      },
      assertions: {
        type: 'array',
        description: 'Array of assertions to validate the response',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['status', 'header', 'body', 'bodyJsonPath', 'responseTime', 'contentType', 'contains', 'notContains', 'matches'],
              description: 'Type of assertion',
            },
            path: {
              type: 'string',
              description: 'Path for header name or JSONPath expression',
            },
            expected: {
              description: 'Expected value',
            },
            operator: {
              type: 'string',
              enum: ['equals', 'contains', 'lessThan', 'greaterThan', 'matches', 'exists'],
              description: 'Comparison operator',
            },
            message: {
              type: 'string',
              description: 'Custom error message',
            },
          },
          required: ['type', 'expected'],
        },
      },
      retryAttempts: {
        type: 'number',
        description: 'Number of retry attempts for failed requests',
        minimum: 0,
        maximum: 5,
        default: 0,
      },
      retryDelay: {
        type: 'number',
        description: 'Delay between retries in milliseconds',
        default: 1000,
      },
    },
    required: ['url'],
  },
};