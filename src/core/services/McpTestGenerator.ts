import { faker } from '@faker-js/faker';
import {
  McpTool,
  McpTestScenario,
  McpTestSuite,
  McpDiscoveryResult,
  McpMethod
} from '../../types/mcp';

export class McpTestGenerator {
  private scenarioCounter = 0;

  constructor() {}

  /**
   * Generate test suite from MCP discovery result
   */
  generateTestSuite(discovery: McpDiscoveryResult): McpTestSuite {
    const scenarios: McpTestScenario[] = [];
    this.scenarioCounter = 0;

    // Generate basic protocol tests
    scenarios.push(...this.generateProtocolTests());

    // Generate tests for each tool
    for (const tool of discovery.tools) {
      scenarios.push(...this.generateToolTests(tool));
    }

    // Generate tests for resources if available
    if (discovery.resources.length > 0) {
      scenarios.push(...this.generateResourceTests(discovery.resources));
    }

    // Calculate metadata
    const metadata = {
      totalScenarios: scenarios.length,
      toolsCovered: discovery.tools.length,
      totalTools: discovery.tools.length,
      coverage: discovery.tools.length > 0 ? 100 : 0
    };

    return {
      id: `mcp-suite-${Date.now()}`,
      serverUrl: discovery.endpoint,
      name: `MCP Test Suite for ${discovery.baseUrl}`,
      description: `Automated test suite for MCP server at ${discovery.endpoint}`,
      scenarios,
      metadata,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate basic protocol tests
   */
  private generateProtocolTests(): McpTestScenario[] {
    const scenarios: McpTestScenario[] = [];

    // Test tools/list
    scenarios.push({
      id: `scenario-${++this.scenarioCounter}`,
      name: 'List available tools',
      description: 'Test tools/list method',
      method: McpMethod.TOOLS_LIST,
      expectedResponse: {
        hasResult: true,
        resultSchema: {
          type: 'object',
          properties: {
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.result.tools',
          operator: 'exists'
        },
        {
          type: 'json_path',
          path: '$.result.tools',
          operator: 'is_array'
        }
      ]
    });

    // Test resources/list
    scenarios.push({
      id: `scenario-${++this.scenarioCounter}`,
      name: 'List available resources',
      description: 'Test resources/list method',
      method: McpMethod.RESOURCES_LIST,
      expectedResponse: {
        hasResult: true,
        resultSchema: {
          type: 'object',
          properties: {
            resources: {
              type: 'array'
            }
          }
        }
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.result.resources',
          operator: 'exists'
        }
      ]
    });

    // Test invalid method
    scenarios.push({
      id: `scenario-${++this.scenarioCounter}`,
      name: 'Invalid method error',
      description: 'Test error handling for invalid method',
      method: 'invalid/method',
      expectedResponse: {
        hasError: true
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.error',
          operator: 'exists'
        },
        {
          type: 'json_path',
          path: '$.error.code',
          operator: 'equals',
          expected: -32601
        }
      ]
    });

    return scenarios;
  }

  /**
   * Generate tests for a specific tool
   */
  private generateToolTests(tool: McpTool): McpTestScenario[] {
    const scenarios: McpTestScenario[] = [];

    // Happy path test with valid parameters
    const validParams = this.generateValidParams(tool.inputSchema);
    scenarios.push({
      id: `scenario-${++this.scenarioCounter}`,
      name: `Call ${tool.name} - Valid params`,
      description: `Test ${tool.name} with valid parameters`,
      method: McpMethod.TOOLS_CALL,
      params: {
        name: tool.name,
        arguments: validParams
      },
      expectedResponse: {
        hasResult: true
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.result',
          operator: 'exists'
        },
        {
          type: 'json_path',
          path: '$.error',
          operator: 'not_exists'
        }
      ]
    });

    // Missing required parameters test
    if (tool.inputSchema?.required && tool.inputSchema.required.length > 0) {
      const missingParams = this.generateMissingRequiredParams(tool.inputSchema);
      scenarios.push({
        id: `scenario-${++this.scenarioCounter}`,
        name: `Call ${tool.name} - Missing required params`,
        description: `Test ${tool.name} with missing required parameters`,
        method: McpMethod.TOOLS_CALL,
        params: {
          name: tool.name,
          arguments: missingParams
        },
        expectedResponse: {
          hasError: true
        },
        assertions: [
          {
            type: 'json_path',
            path: '$.error',
            operator: 'exists'
          }
        ]
      });
    }

    // Invalid parameter type test
    if (tool.inputSchema?.properties) {
      const invalidParams = this.generateInvalidTypeParams(tool.inputSchema);
      if (invalidParams && Object.keys(invalidParams).length > 0) {
        scenarios.push({
          id: `scenario-${++this.scenarioCounter}`,
          name: `Call ${tool.name} - Invalid param types`,
          description: `Test ${tool.name} with invalid parameter types`,
          method: McpMethod.TOOLS_CALL,
          params: {
            name: tool.name,
            arguments: invalidParams
          },
          expectedResponse: {
            hasError: true
          },
          assertions: [
            {
              type: 'json_path',
              path: '$.error',
              operator: 'exists'
            }
          ]
        });
      }
    }

    return scenarios;
  }

  /**
   * Generate tests for resources
   */
  private generateResourceTests(resources: any[]): McpTestScenario[] {
    const scenarios: McpTestScenario[] = [];

    // Test reading first resource
    if (resources.length > 0) {
      const resource = resources[0];
      scenarios.push({
        id: `scenario-${++this.scenarioCounter}`,
        name: `Read resource: ${resource.name}`,
        description: `Test reading resource ${resource.uri}`,
        method: McpMethod.RESOURCES_READ,
        params: {
          uri: resource.uri
        },
        expectedResponse: {
          hasResult: true
        },
        assertions: [
          {
            type: 'json_path',
            path: '$.result',
            operator: 'exists'
          }
        ]
      });
    }

    // Test non-existent resource
    scenarios.push({
      id: `scenario-${++this.scenarioCounter}`,
      name: 'Read non-existent resource',
      description: 'Test error handling for non-existent resource',
      method: McpMethod.RESOURCES_READ,
      params: {
        uri: 'mcp://non-existent/resource'
      },
      expectedResponse: {
        hasError: true
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.error',
          operator: 'exists'
        }
      ]
    });

    return scenarios;
  }

  /**
   * Generate valid parameters based on schema
   */
  private generateValidParams(schema: any): any {
    if (!schema || !schema.properties) {
      return {};
    }

    const params: any = {};
    const required = schema.required || [];

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Include required fields and randomly include optional ones
      if (required.includes(key) || Math.random() > 0.5) {
        params[key] = this.generateValueForType(propSchema as any);
      }
    }

    return params;
  }

  /**
   * Generate parameters with missing required fields
   */
  private generateMissingRequiredParams(schema: any): any {
    if (!schema || !schema.properties || !schema.required) {
      return {};
    }

    const params: any = {};
    const required = schema.required;

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Skip first required field to create missing param scenario
      if (required[0] === key) {
        continue;
      }
      if (required.includes(key)) {
        params[key] = this.generateValueForType(propSchema as any);
      }
    }

    return params;
  }

  /**
   * Generate parameters with invalid types
   */
  private generateInvalidTypeParams(schema: any): any {
    if (!schema || !schema.properties) {
      return {};
    }

    const params: any = {};
    const properties = Object.entries(schema.properties);
    
    if (properties.length > 0) {
      const [key, propSchema] = properties[0];
      // Generate wrong type value
      params[key] = this.generateWrongTypeValue(propSchema as any);
    }

    return params;
  }

  /**
   * Generate value based on schema type
   */
  private generateValueForType(schema: any): any {
    if (!schema) return faker.string.sample();

    const type = schema.type;

    switch (type) {
      case 'string':
        if (schema.enum) {
          return faker.helpers.arrayElement(schema.enum);
        }
        if (schema.format === 'email') {
          return faker.internet.email();
        }
        if (schema.format === 'url' || schema.format === 'uri') {
          return faker.internet.url();
        }
        if (schema.format === 'date') {
          return faker.date.recent().toISOString().split('T')[0];
        }
        if (schema.format === 'date-time') {
          return faker.date.recent().toISOString();
        }
        return faker.string.alpha({ length: 10 });

      case 'number':
      case 'integer':
        const min = schema.minimum || 1;
        const max = schema.maximum || 100;
        return faker.number.int({ min, max });

      case 'boolean':
        return faker.datatype.boolean();

      case 'array':
        const itemCount = faker.number.int({ min: 1, max: 3 });
        return Array(itemCount).fill(null).map(() => 
          this.generateValueForType(schema.items)
        );

      case 'object':
        return this.generateValidParams(schema);

      default:
        return faker.string.sample();
    }
  }

  /**
   * Generate wrong type value for testing
   */
  private generateWrongTypeValue(schema: any): any {
    const type = schema?.type;

    // Return opposite type
    switch (type) {
      case 'string':
        return faker.number.int();
      case 'number':
      case 'integer':
        return faker.string.alpha();
      case 'boolean':
        return faker.string.alpha();
      case 'array':
        return faker.string.alpha();
      case 'object':
        return faker.string.alpha();
      default:
        return null;
    }
  }

  /**
   * Generate test scenarios for a specific method
   */
  generateMethodTest(method: string, params?: any): McpTestScenario {
    return {
      id: `scenario-${++this.scenarioCounter}`,
      name: `Test ${method}`,
      description: `Test MCP method ${method}`,
      method,
      params,
      expectedResponse: {
        hasResult: true
      },
      assertions: [
        {
          type: 'json_path',
          path: '$.jsonrpc',
          operator: 'equals',
          expected: '2.0'
        }
      ]
    };
  }
}