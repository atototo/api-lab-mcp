import { z } from 'zod';
import { BatchTestService } from '../../core/services/BatchTestService';
import { BatchTestRequestSchema, BatchTestOptionsSchema } from '../../types/batch';
import { authSchema, assertionSchema } from './schemaHelpers';

export const batchTestTool = {
  name: 'batch_test',
  description: 'Execute multiple API tests in batch with parallel or sequential execution',
  inputSchema: {
    type: 'object',
    properties: {
      tests: {
        type: 'array',
        description: 'Array of test requests to execute',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Test name' },
            url: { type: 'string', description: 'URL to test' },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
              description: 'HTTP method'
            },
            headers: {
              type: 'object',
              description: 'HTTP headers',
              additionalProperties: { type: 'string' }
            },
            body: { description: 'Request body' },
            params: {
              type: 'object',
              description: 'Query parameters',
              additionalProperties: { type: 'string' }
            },
            auth: authSchema,
            assertions: {
              type: 'array',
              description: 'Assertions to validate',
              items: assertionSchema
            },
            delay: { type: 'number', description: 'Delay before request (ms)' }
          },
          required: ['name', 'url']
        }
      },
      options: {
        type: 'object',
        description: 'Batch execution options',
        properties: {
          parallel: { type: 'boolean', description: 'Run tests in parallel' },
          maxConcurrent: { type: 'number', description: 'Max concurrent requests' },
          stopOnFailure: { type: 'boolean', description: 'Stop on first failure' },
          delayBetween: { type: 'number', description: 'Delay between requests (ms)' },
          timeout: { type: 'number', description: 'Request timeout (ms)' },
          retryOnFailure: { type: 'boolean', description: 'Retry failed requests' },
          retryAttempts: { type: 'number', description: 'Number of retry attempts' }
        }
      },
      reportFormat: {
        type: 'string',
        enum: ['full', 'summary', 'failures'],
        default: 'full',
        description: 'Format of the report: full (all details), summary (overview only), or failures (only failed tests)'
      }
    },
    required: ['tests']
  }
};

export async function handleBatchTest(
  args: any,
  context: { httpClient: any }
): Promise<any> {
  try {
    const { tests, options, reportFormat } = args;
    
    // Create batch test service
    const batchService = new BatchTestService(context.httpClient);
    
    // Execute batch
    const report = await batchService.executeBatch(tests, options || {});
    
    // Format report based on requested format
    switch (reportFormat) {
      case 'summary':
        return {
          success: report.failedTests === 0,
          startTime: report.startTime,
          endTime: report.endTime,
          totalDuration: `${report.totalDuration}ms`,
          totalTests: report.totalTests,
          successfulTests: report.successfulTests,
          failedTests: report.failedTests,
          successRate: `${report.summary.successRate.toFixed(2)}%`,
          averageDuration: `${report.summary.averageDuration.toFixed(2)}ms`,
          stopped: report.stopped,
          ...(report.summary.totalAssertions && {
            assertions: {
              total: report.summary.totalAssertions,
              passed: report.summary.passedAssertions,
              failed: report.summary.failedAssertions
            }
          })
        };
        
      case 'failures':
        const failures = report.results.filter(r => !r.success);
        return {
          success: failures.length === 0,
          failedTests: failures.length,
          totalTests: report.totalTests,
          failures: failures.map(f => ({
            name: f.name,
            url: f.url,
            method: f.method,
            status: f.status,
            error: f.error,
            duration: `${f.duration}ms`
          })),
          stopped: report.stopped
        };
        
      case 'full':
      default:
        return {
          success: report.failedTests === 0,
          report: {
            timing: {
              startTime: report.startTime,
              endTime: report.endTime,
              totalDuration: `${report.totalDuration}ms`
            },
            summary: {
              totalTests: report.totalTests,
              successfulTests: report.successfulTests,
              failedTests: report.failedTests,
              successRate: `${report.summary.successRate.toFixed(2)}%`,
              averageDuration: `${report.summary.averageDuration.toFixed(2)}ms`,
              minDuration: `${report.summary.minDuration}ms`,
              maxDuration: `${report.summary.maxDuration}ms`,
              ...(report.summary.totalAssertions && {
                assertions: {
                  total: report.summary.totalAssertions,
                  passed: report.summary.passedAssertions,
                  failed: report.summary.failedAssertions
                }
              })
            },
            results: report.results.map(r => ({
              name: r.name,
              url: r.url,
              method: r.method,
              success: r.success,
              status: r.status,
              statusText: r.statusText,
              duration: r.duration ? `${r.duration}ms` : undefined,
              error: r.error,
              ...(r.assertionResults && {
                assertions: {
                  passed: r.assertionResults.passed,
                  failed: r.assertionResults.failed,
                  total: r.assertionResults.total
                }
              })
            })),
            stopped: report.stopped
          }
        };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute batch tests',
      suggestion: 'Check test configurations and ensure all URLs are valid'
    };
  }
}