import { McpProtocolParser } from '../../core/services/McpProtocolParser';
import { McpTestGenerator } from '../../core/services/McpTestGenerator';
import { McpEndpointConfig } from '../../types/mcp';
import fs from 'fs/promises';

export const generateMcpTestsTool = {
  name: 'generate_mcp_tests',
  description: 'Generate comprehensive test scenarios for an MCP server',
  inputSchema: {
    type: 'object',
    properties: {
      baseUrl: {
        type: 'string',
        description: 'Base URL of the MCP server (e.g., http://localhost:3001)'
      },
      path: {
        type: 'string',
        description: 'MCP endpoint path (default: /mcp)',
        default: '/mcp'
      },
      headers: {
        type: 'object',
        description: 'Additional headers',
        additionalProperties: {
          type: 'string'
        }
      },
      options: {
        type: 'object',
        description: 'Test generation options',
        properties: {
          includeProtocolTests: {
            type: 'boolean',
            description: 'Include basic protocol tests',
            default: true
          },
          includeErrorTests: {
            type: 'boolean',
            description: 'Include error handling tests',
            default: true
          },
          includeResourceTests: {
            type: 'boolean',
            description: 'Include resource tests',
            default: true
          },
          maxTestsPerTool: {
            type: 'number',
            description: 'Maximum tests to generate per tool',
            default: 3
          }
        }
      },
      outputFile: {
        type: 'string',
        description: 'Save test suite to file'
      }
    },
    required: ['baseUrl']
  }
};

export async function handleGenerateMcpTests(args: any): Promise<any> {
  try {
    const { baseUrl, path, headers, options = {}, outputFile } = args;

    // First, discover the server
    const config: McpEndpointConfig = {
      baseUrl,
      path: path || '/mcp',
      headers,
      timeout: 30000
    };

    const parser = new McpProtocolParser();
    const discovery = await parser.discoverServer(config);

    if (!discovery.isAvailable) {
      return {
        success: false,
        error: `MCP server at ${discovery.endpoint} is not available`,
        suggestion: 'Check that the server is running and accessible'
      };
    }

    // Generate test suite
    const generator = new McpTestGenerator();
    const testSuite = generator.generateTestSuite(discovery);

    // Apply filters based on options
    let scenarios = testSuite.scenarios;

    if (options.includeProtocolTests === false) {
      scenarios = scenarios.filter(s => 
        !s.name.toLowerCase().includes('list') && 
        !s.name.toLowerCase().includes('protocol')
      );
    }

    if (options.includeErrorTests === false) {
      scenarios = scenarios.filter(s => 
        !s.name.toLowerCase().includes('error') && 
        !s.name.toLowerCase().includes('invalid') &&
        !s.name.toLowerCase().includes('missing')
      );
    }

    if (options.includeResourceTests === false) {
      scenarios = scenarios.filter(s => 
        !s.method.includes('resources/')
      );
    }

    if (options.maxTestsPerTool) {
      // Group by tool and limit
      const toolTests: Record<string, any[]> = {};
      const otherTests: any[] = [];

      for (const scenario of scenarios) {
        if (scenario.params?.name) {
          const toolName = scenario.params.name;
          if (!toolTests[toolName]) {
            toolTests[toolName] = [];
          }
          if (toolTests[toolName].length < options.maxTestsPerTool) {
            toolTests[toolName].push(scenario);
          }
        } else {
          otherTests.push(scenario);
        }
      }

      scenarios = [
        ...otherTests,
        ...Object.values(toolTests).flat()
      ];
    }

    // Update test suite with filtered scenarios
    testSuite.scenarios = scenarios;
    testSuite.metadata.totalScenarios = scenarios.length;

    // Save to file if requested
    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(testSuite, null, 2), 'utf-8');
    }

    // Format response
    return {
      success: true,
      testSuite: {
        id: testSuite.id,
        serverUrl: testSuite.serverUrl,
        name: testSuite.name,
        description: testSuite.description,
        metadata: testSuite.metadata
      },
      scenarios: scenarios.map(s => ({
        id: s.id,
        name: s.name,
        method: s.method,
        hasParams: !!s.params,
        assertionCount: s.assertions?.length || 0,
        expectsError: s.expectedResponse?.hasError || false
      })),
      summary: {
        total: scenarios.length,
        byMethod: scenarios.reduce((acc, s) => {
          acc[s.method] = (acc[s.method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        tools: discovery.tools.map(t => t.name),
        resources: discovery.resources.length
      },
      ...(outputFile && { savedTo: outputFile }),
      usage: {
        executeTests: 'Use batch_test to run these scenarios',
        example: {
          tool: 'test_mcp_endpoint',
          args: {
            url: testSuite.serverUrl,
            method: scenarios[0]?.method,
            params: scenarios[0]?.params
          }
        }
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate MCP tests',
      suggestion: 'Check the server URL and ensure the MCP server is running'
    };
  }
}