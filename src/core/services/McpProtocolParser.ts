import axios, { AxiosResponse } from 'axios';
import { 
  McpRequest, 
  McpResponse, 
  McpTool, 
  McpResource,
  McpServerInfo,
  McpDiscoveryResult,
  McpEndpointConfig,
  McpMethod,
  SseMessage
} from '../../types/mcp';

export class McpProtocolParser {
  private defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };

  constructor() {}

  /**
   * Discover and analyze MCP server
   */
  async discoverServer(config: McpEndpointConfig): Promise<McpDiscoveryResult> {
    const endpoint = this.buildEndpoint(config);
    const result: McpDiscoveryResult = {
      baseUrl: config.baseUrl,
      endpoint,
      tools: [],
      resources: [],
      isAvailable: false
    };

    try {
      // Try to initialize/ping the server first
      const pingResponse = await this.sendRequest(endpoint, {
        jsonrpc: '2.0',
        method: McpMethod.PING,
        id: 'ping-1'
      }, config.headers, config.timeout);

      if (pingResponse) {
        result.isAvailable = true;
      }

      // Get server info if available
      try {
        const initResponse = await this.sendRequest(endpoint, {
          jsonrpc: '2.0',
          method: McpMethod.INITIALIZE,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {}
          },
          id: 'init-1'
        }, config.headers, config.timeout);

        if (initResponse?.result) {
          result.serverInfo = initResponse.result as McpServerInfo;
        }
      } catch (e) {
        // Server might not support initialize
      }

      // List available tools
      const toolsResponse = await this.sendRequest(endpoint, {
        jsonrpc: '2.0',
        method: McpMethod.TOOLS_LIST,
        id: 'tools-1'
      }, config.headers, config.timeout);

      if (toolsResponse?.result?.tools) {
        result.tools = toolsResponse.result.tools as McpTool[];
      }

      // List available resources
      const resourcesResponse = await this.sendRequest(endpoint, {
        jsonrpc: '2.0',
        method: McpMethod.RESOURCES_LIST,
        id: 'resources-1'
      }, config.headers, config.timeout);

      if (resourcesResponse?.result?.resources) {
        result.resources = resourcesResponse.result.resources as McpResource[];
      }

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Failed to discover MCP server';
      return result;
    }
  }

  /**
   * Send MCP request and handle response
   */
  async sendRequest(
    endpoint: string,
    request: McpRequest,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<McpResponse | null> {
    try {
      const response = await axios.post(
        endpoint,
        request,
        {
          headers: {
            ...this.defaultHeaders,
            ...headers
          },
          timeout: timeout || 30000,
          responseType: 'text'
        }
      );

      // Handle SSE response
      if (response.headers['content-type']?.includes('text/event-stream')) {
        return this.parseSseResponse(response.data);
      }

      // Handle regular JSON response
      if (typeof response.data === 'string') {
        try {
          return JSON.parse(response.data) as McpResponse;
        } catch {
          // Try to extract JSON from the response
          const jsonMatch = response.data.match(/\{.*\}/s);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as McpResponse;
          }
        }
      }

      return response.data as McpResponse;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          // Try to parse error response
          if (typeof error.response.data === 'string') {
            try {
              const parsed = JSON.parse(error.response.data);
              if (parsed.error) {
                return parsed as McpResponse;
              }
            } catch {
              // Not JSON
            }
          }
        }
        throw new Error(`MCP request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse Server-Sent Events response
   */
  private parseSseResponse(data: string): McpResponse | null {
    const lines = data.split('\n');
    const messages: SseMessage[] = [];
    let currentMessage: Partial<SseMessage> = {};

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentMessage.event = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        currentMessage.data = line.substring(5).trim();
      } else if (line.startsWith('id:')) {
        currentMessage.id = line.substring(3).trim();
      } else if (line.startsWith('retry:')) {
        currentMessage.retry = parseInt(line.substring(6).trim());
      } else if (line.trim() === '' && currentMessage.data) {
        messages.push(currentMessage as SseMessage);
        currentMessage = {};
      }
    }

    // Add last message if exists
    if (currentMessage.data) {
      messages.push(currentMessage as SseMessage);
    }

    // Find the message with the response
    for (const message of messages) {
      if (message.event === 'message' || !message.event) {
        try {
          const parsed = JSON.parse(message.data);
          if (parsed.jsonrpc === '2.0') {
            return parsed as McpResponse;
          }
        } catch {
          // Not JSON or not JSON-RPC
        }
      }
    }

    return null;
  }

  /**
   * Build full endpoint URL
   */
  private buildEndpoint(config: McpEndpointConfig): string {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const path = config.path || '/mcp';
    return `${baseUrl}${path}`;
  }

  /**
   * Call an MCP tool
   */
  async callTool(
    endpoint: string,
    toolName: string,
    args: any,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<McpResponse | null> {
    return this.sendRequest(
      endpoint,
      {
        jsonrpc: '2.0',
        method: McpMethod.TOOLS_CALL,
        params: {
          name: toolName,
          arguments: args
        },
        id: `tool-${Date.now()}`
      },
      headers,
      timeout
    );
  }

  /**
   * Read an MCP resource
   */
  async readResource(
    endpoint: string,
    uri: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<McpResponse | null> {
    return this.sendRequest(
      endpoint,
      {
        jsonrpc: '2.0',
        method: McpMethod.RESOURCES_READ,
        params: {
          uri
        },
        id: `resource-${Date.now()}`
      },
      headers,
      timeout
    );
  }

  /**
   * Validate MCP response
   */
  validateResponse(response: McpResponse): {
    isValid: boolean;
    error?: string;
  } {
    if (!response) {
      return { isValid: false, error: 'No response received' };
    }

    if (response.jsonrpc !== '2.0') {
      return { isValid: false, error: 'Invalid JSON-RPC version' };
    }

    if (response.error) {
      return {
        isValid: false,
        error: `Error ${response.error.code}: ${response.error.message}`
      };
    }

    if (!response.result && !response.error) {
      return { isValid: false, error: 'Response missing result and error' };
    }

    return { isValid: true };
  }

  /**
   * Extract tool schemas from discovery result
   */
  extractToolSchemas(tools: McpTool[]): Record<string, any> {
    const schemas: Record<string, any> = {};
    
    for (const tool of tools) {
      if (tool.inputSchema) {
        schemas[tool.name] = {
          name: tool.name,
          description: tool.description,
          schema: tool.inputSchema,
          required: tool.inputSchema.required || [],
          properties: tool.inputSchema.properties || {}
        };
      }
    }

    return schemas;
  }
}