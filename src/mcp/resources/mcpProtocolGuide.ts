export const mcpProtocolGuideResource = {
  uri: 'mcp://api-forge/protocol-guide',
  name: 'MCP Protocol Testing Guide',
  description: 'Comprehensive guide for testing MCP protocol endpoints',
  mimeType: 'text/markdown'
};

export const getMcpProtocolGuideContent = () => `# MCP Protocol Testing Guide

## What is MCP?

MCP (Model Context Protocol) is a protocol for communication between AI models and external tools/services. It uses JSON-RPC 2.0 over HTTP with Server-Sent Events (SSE) for streaming responses.

## MCP Server Endpoints

### Local Servers
- **URL Pattern**: \`http://localhost:PORT/mcp\` or \`http://127.0.0.1:PORT/mcp\`
- **Examples**:
  - \`http://localhost:3001/mcp\` - Default local development
  - \`http://127.0.0.1:8080/mcp\` - Alternative port

### Remote Servers
- **URL Pattern**: \`https://HOSTNAME/PATH\` or \`http://HOSTNAME:PORT/PATH\`
- **Examples**:
  - \`https://api.example.com/mcp\` - Production server
  - \`https://mcp.service.io/v1/endpoint\` - Versioned API
  - \`http://192.168.1.100:3000/mcp\` - Local network server

### Cloud/SaaS Providers
- **Examples**:
  - \`https://api.anthropic.com/mcp\` - Anthropic's MCP endpoint
  - \`https://mcp.openai.com/v1\` - OpenAI-compatible endpoint
  - Custom enterprise endpoints

## Protocol Basics

### Request Format (JSON-RPC 2.0)
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "METHOD_NAME",
  "params": { /* optional parameters */ },
  "id": "unique-request-id"
}
\`\`\`

### Response Format (SSE)
\`\`\`
event: message
data: {"jsonrpc":"2.0","result":{...},"id":"unique-request-id"}

event: error
data: {"jsonrpc":"2.0","error":{"code":-32600,"message":"Error"},"id":"unique-request-id"}
\`\`\`

### Required Headers
\`\`\`http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
\`\`\`

## Core MCP Methods

### 1. Discovery Methods

#### tools/list
Lists all available tools on the server.
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": "1"
}
\`\`\`

#### resources/list
Lists all available resources.
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "id": "2"
}
\`\`\`

### 2. Execution Methods

#### tools/call
Executes a specific tool with arguments.
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "test query"
    }
  },
  "id": "3"
}
\`\`\`

#### resources/read
Reads a specific resource by URI.
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "mcp://server/resource-name"
  },
  "id": "4"
}
\`\`\`

## Testing with API Forge

### Step 1: Discover Server
\`\`\`json
{
  "tool": "discover_mcp_server",
  "args": {
    "baseUrl": "http://localhost:3001"
  }
}
\`\`\`

### Step 2: Test Specific Method
\`\`\`json
{
  "tool": "test_mcp_endpoint",
  "args": {
    "url": "http://localhost:3001/mcp",
    "method": "tools/list"
  }
}
\`\`\`

### Step 3: Generate Test Suite
\`\`\`json
{
  "tool": "generate_mcp_tests",
  "args": {
    "baseUrl": "http://localhost:3001",
    "outputFile": "mcp-tests.json"
  }
}
\`\`\`

## Common MCP Server Implementations

### 1. Claude Desktop MCP Servers
- Usually run on localhost with various ports
- Support standard MCP protocol
- Examples: filesystem, github, slack integrations

### 2. Custom Enterprise MCP Servers
- May have authentication requirements
- Custom headers or path structures
- Extended protocol features

### 3. Third-party MCP Services
- Public MCP endpoints
- API key authentication
- Rate limiting considerations

## Authentication Patterns

### No Authentication
Most local MCP servers don't require authentication.

### API Key
\`\`\`json
{
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
\`\`\`

### Custom Headers
\`\`\`json
{
  "headers": {
    "X-API-Key": "YOUR_KEY",
    "X-Client-ID": "CLIENT_ID"
  }
}
\`\`\`

## Error Codes

### Standard JSON-RPC Errors
- \`-32700\`: Parse error
- \`-32600\`: Invalid request
- \`-32601\`: Method not found
- \`-32602\`: Invalid params
- \`-32603\`: Internal error

### MCP-Specific Errors
- \`-32001\`: Resource not found
- \`-32002\`: Tool not found
- \`-32003\`: Invalid tool arguments

## Best Practices

1. **Always discover first**: Use \`discover_mcp_server\` to understand server capabilities
2. **Test incrementally**: Start with \`tools/list\` before calling specific tools
3. **Handle SSE properly**: MCP responses use Server-Sent Events format
4. **Set appropriate timeouts**: Some operations may take longer
5. **Check server documentation**: Each MCP server may have specific requirements

## Troubleshooting

### Connection Refused
- Check if server is running
- Verify correct port number
- Check firewall settings

### Method Not Found
- Server may not support all MCP methods
- Use discovery to see available methods

### Invalid Response Format
- Some servers may not fully comply with MCP spec
- Check server documentation for variations

### Timeout Issues
- Increase timeout for slow operations
- Check network connectivity
- Verify server is responding

## Examples by Server Type

### Local Development Server
\`\`\`json
{
  "baseUrl": "http://localhost:3001",
  "path": "/mcp"
}
\`\`\`

### Production API Server
\`\`\`json
{
  "baseUrl": "https://api.company.com",
  "path": "/v1/mcp",
  "headers": {
    "Authorization": "Bearer token"
  }
}
\`\`\`

### Docker Container
\`\`\`json
{
  "baseUrl": "http://mcp-container:8080",
  "path": "/mcp"
}
\`\`\`

## Further Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
`;