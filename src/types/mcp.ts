// MCP (Model Context Protocol) type definitions

export interface McpRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number;
}

export interface McpResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: McpError;
  id: string | number;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  [key: string]: any;
}

export interface McpServerInfo {
  name?: string;
  version?: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    [key: string]: any;
  };
}

export interface McpDiscoveryResult {
  baseUrl: string;
  endpoint: string;
  serverInfo?: McpServerInfo;
  tools: McpTool[];
  resources: McpResource[];
  isAvailable: boolean;
  error?: string;
}

export interface McpTestScenario {
  id: string;
  name: string;
  description: string;
  method: string;
  params?: any;
  expectedResponse?: {
    hasResult?: boolean;
    hasError?: boolean;
    resultSchema?: any;
  };
  assertions?: Array<{
    type: string;
    path?: string;
    expected?: any;
    operator?: string;
  }>;
}

export interface McpTestSuite {
  id: string;
  serverUrl: string;
  name: string;
  description: string;
  scenarios: McpTestScenario[];
  metadata: {
    totalScenarios: number;
    toolsCovered: number;
    totalTools: number;
    coverage: number;
  };
  createdAt: string;
}

// SSE (Server-Sent Events) related types
export interface SseMessage {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface McpEndpointConfig {
  baseUrl: string;
  path?: string;  // defaults to '/mcp'
  headers?: Record<string, string>;
  timeout?: number;
}

// Common MCP methods
export enum McpMethod {
  // Tool methods
  TOOLS_LIST = 'tools/list',
  TOOLS_CALL = 'tools/call',
  
  // Resource methods
  RESOURCES_LIST = 'resources/list',
  RESOURCES_READ = 'resources/read',
  RESOURCES_SUBSCRIBE = 'resources/subscribe',
  RESOURCES_UNSUBSCRIBE = 'resources/unsubscribe',
  
  // Prompt methods
  PROMPTS_LIST = 'prompts/list',
  PROMPTS_GET = 'prompts/get',
  
  // Server methods
  INITIALIZE = 'initialize',
  PING = 'ping',
  
  // Logging methods
  LOGGING_SET_LEVEL = 'logging/setLevel',
}

// JSON-RPC error codes
export enum JsonRpcErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  // MCP specific errors
  RESOURCE_NOT_FOUND = -32001,
  TOOL_NOT_FOUND = -32002,
  INVALID_TOOL_ARGUMENTS = -32003,
}