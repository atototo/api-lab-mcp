import { McpProtocolParser } from '../../core/services/McpProtocolParser';
import { McpRequest } from '../../types/mcp';

export const testMcpEndpointTool = {
  name: 'test_mcp_endpoint',
  description: 'Test a specific MCP endpoint method with parameters',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Full MCP endpoint URL (e.g., http://localhost:3001/mcp)'
      },
      method: {
        type: 'string',
        description: 'MCP method to call (e.g., tools/list, tools/call, resources/list)',
        enum: [
          'tools/list',
          'tools/call',
          'resources/list',
          'resources/read',
          'prompts/list',
          'prompts/get',
          'initialize',
          'ping'
        ]
      },
      params: {
        type: 'object',
        description: 'Parameters for the method (if required)',
        properties: {
          name: {
            type: 'string',
            description: 'Tool or resource name (for tools/call or resources/read)'
          },
          arguments: {
            type: 'object',
            description: 'Arguments for tool call',
            additionalProperties: true
          },
          uri: {
            type: 'string',
            description: 'Resource URI (for resources/read)'
          }
        }
      },
      headers: {
        type: 'object',
        description: 'Additional headers to send',
        additionalProperties: {
          type: 'string'
        }
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 30000
      },
      assertions: {
        type: 'array',
        description: 'Assertions to validate the response',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['status', 'json_path', 'contains', 'not_contains']
            },
            path: {
              type: 'string',
              description: 'JSON path for json_path assertion'
            },
            expected: {
              description: 'Expected value'
            },
            operator: {
              type: 'string',
              enum: ['equals', 'exists', 'not_exists', 'is_array', 'is_object']
            }
          }
        }
      }
    },
    required: ['url', 'method']
  }
};

export async function handleTestMcpEndpoint(args: any): Promise<any> {
  try {
    const { url, method, params, headers, timeout, assertions } = args;

    // Create MCP request
    const request: McpRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: `test-${Date.now()}`
    };

    // Send request
    const parser = new McpProtocolParser();
    const startTime = Date.now();
    const response = await parser.sendRequest(url, request, headers, timeout);
    const duration = Date.now() - startTime;

    // Validate response
    const validation = response ? parser.validateResponse(response) : 
      { isValid: false, error: 'No response received' };

    // Run assertions if provided
    let assertionResults: any[] = [];
    if (assertions && response) {
      assertionResults = runAssertions(response, assertions);
    }

    // Format result
    const result = {
      success: validation.isValid && (assertionResults.length === 0 || 
                assertionResults.every(a => a.passed)),
      request: {
        url,
        method,
        params,
        headers
      },
      response: response ? {
        jsonrpc: response.jsonrpc,
        id: response.id,
        ...(response.result && { result: response.result }),
        ...(response.error && { error: response.error })
      } : null,
      validation,
      metrics: {
        responseTime: `${duration}ms`
      },
      ...(assertionResults.length > 0 && {
        assertions: {
          total: assertionResults.length,
          passed: assertionResults.filter(a => a.passed).length,
          failed: assertionResults.filter(a => !a.passed).length,
          details: assertionResults
        }
      }),
      examples: {
        listTools: {
          method: 'tools/list'
        },
        callTool: {
          method: 'tools/call',
          params: {
            name: 'tool_name',
            arguments: {}
          }
        },
        readResource: {
          method: 'resources/read',
          params: {
            uri: 'mcp://server/resource'
          }
        }
      }
    };

    return result;

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test MCP endpoint',
      suggestion: 'Check that the URL and method are correct, and the server is running'
    };
  }
}

function runAssertions(response: any, assertions: any[]): any[] {
  const results: any[] = [];

  for (const assertion of assertions) {
    const result = {
      type: assertion.type,
      passed: false,
      message: ''
    };

    try {
      switch (assertion.type) {
        case 'json_path':
          const value = getJsonPath(response, assertion.path);
          result.passed = evaluateOperator(value, assertion.operator, assertion.expected);
          result.message = `Path ${assertion.path} ${assertion.operator} ${assertion.expected}`;
          break;

        case 'contains':
          const responseStr = JSON.stringify(response);
          result.passed = responseStr.includes(assertion.expected);
          result.message = `Response contains "${assertion.expected}"`;
          break;

        case 'not_contains':
          const responseStr2 = JSON.stringify(response);
          result.passed = !responseStr2.includes(assertion.expected);
          result.message = `Response does not contain "${assertion.expected}"`;
          break;

        default:
          result.message = `Unknown assertion type: ${assertion.type}`;
      }
    } catch (error) {
      result.passed = false;
      result.message = `Assertion error: ${error}`;
    }

    results.push(result);
  }

  return results;
}

function getJsonPath(obj: any, path: string): any {
  // Simple JSON path implementation
  const parts = path.replace('$', '').split('.').filter(p => p);
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function evaluateOperator(value: any, operator: string, expected?: any): boolean {
  switch (operator) {
    case 'exists':
      return value !== undefined && value !== null;
    case 'not_exists':
      return value === undefined || value === null;
    case 'equals':
      return value === expected;
    case 'is_array':
      return Array.isArray(value);
    case 'is_object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}