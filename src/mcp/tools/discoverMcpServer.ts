import { McpProtocolParser } from '../../core/services/McpProtocolParser';
import { McpEndpointConfig } from '../../types/mcp';

export const discoverMcpServerTool = {
  name: 'discover_mcp_server',
  description: 'Discover and analyze an MCP server to find available tools and resources',
  inputSchema: {
    type: 'object',
    properties: {
      baseUrl: {
        type: 'string',
        description: 'Base URL of the MCP server (e.g., http://localhost:3001, https://api.example.com)'
      },
      path: {
        type: 'string',
        description: 'MCP endpoint path (default: /mcp)',
        default: '/mcp'
      },
      headers: {
        type: 'object',
        description: 'Additional headers to send with the request',
        additionalProperties: {
          type: 'string'
        }
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 30000
      }
    },
    required: ['baseUrl']
  }
};

export async function handleDiscoverMcpServer(args: any): Promise<any> {
  try {
    const config: McpEndpointConfig = {
      baseUrl: args.baseUrl,
      path: args.path || '/mcp',
      headers: args.headers,
      timeout: args.timeout || 30000
    };

    const parser = new McpProtocolParser();
    const discovery = await parser.discoverServer(config);

    // Format the response
    const response = {
      success: discovery.isAvailable,
      server: {
        baseUrl: discovery.baseUrl,
        endpoint: discovery.endpoint,
        available: discovery.isAvailable,
        info: discovery.serverInfo
      },
      capabilities: {
        tools: discovery.tools.length > 0,
        resources: discovery.resources.length > 0,
        totalTools: discovery.tools.length,
        totalResources: discovery.resources.length
      },
      tools: discovery.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        hasSchema: !!tool.inputSchema,
        requiredParams: tool.inputSchema?.required || [],
        parameters: tool.inputSchema?.properties ? 
          Object.keys(tool.inputSchema.properties) : []
      })),
      resources: discovery.resources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      })),
      ...(discovery.error && { error: discovery.error }),
      usage: {
        testEndpoint: `Use 'test_mcp_endpoint' to test individual methods`,
        generateTests: `Use 'generate_mcp_tests' to create test scenarios`,
        example: {
          tool: 'test_mcp_endpoint',
          args: {
            url: discovery.endpoint,
            method: 'tools/call',
            params: {
              name: discovery.tools[0]?.name || 'tool_name',
              arguments: {}
            }
          }
        }
      }
    };

    return response;

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discover MCP server',
      suggestion: 'Check that the server URL is correct and the MCP endpoint is accessible'
    };
  }
}