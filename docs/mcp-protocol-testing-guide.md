# MCP Protocol Testing Guide

## Overview

API Forge now supports testing MCP (Model Context Protocol) servers, providing similar capabilities to OpenAPI/Swagger testing but for MCP/JSON-RPC endpoints.

## What is MCP?

MCP uses JSON-RPC 2.0 over HTTP with Server-Sent Events (SSE) for streaming responses. It's commonly used for AI tool communication.

## Testing MCP Servers

### 1. Discover MCP Server

First, discover what tools and resources are available on an MCP server:

```bash
# Test local MCP server
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "discover_mcp_server",
    "params": {
      "name": "discover_mcp_server",
      "arguments": {
        "baseUrl": "http://localhost:3001"
      }
    },
    "id": 1
  }'

# Test remote MCP server
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "discover_mcp_server",
    "params": {
      "name": "discover_mcp_server",
      "arguments": {
        "baseUrl": "https://api.example.com",
        "path": "/v1/mcp",
        "headers": {
          "Authorization": "Bearer YOUR_TOKEN"
        }
      }
    },
    "id": 1
  }'
```

### 2. Test Specific MCP Method

Test individual MCP methods with parameters:

```bash
# List tools
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "test_mcp_endpoint",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "tools/list"
      }
    },
    "id": 1
  }'

# Call a specific tool
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "test_mcp_endpoint",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "tools/call",
        "params": {
          "name": "search",
          "arguments": {
            "query": "test query"
          }
        }
      }
    },
    "id": 1
  }'

# Read a resource
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "test_mcp_endpoint",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "resources/read",
        "params": {
          "uri": "mcp://server/resource-name"
        }
      }
    },
    "id": 1
  }'
```

### 3. Generate Comprehensive Test Suite

Generate a complete test suite for an MCP server:

```bash
# Generate tests for local server
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "generate_mcp_tests",
    "params": {
      "name": "generate_mcp_tests",
      "arguments": {
        "baseUrl": "http://localhost:3001",
        "outputFile": "mcp-test-suite.json"
      }
    },
    "id": 1
  }'

# Generate tests with custom options
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "generate_mcp_tests",
    "params": {
      "name": "generate_mcp_tests",
      "arguments": {
        "baseUrl": "http://localhost:3001",
        "options": {
          "includeProtocolTests": true,
          "includeErrorTests": true,
          "includeResourceTests": true,
          "maxTestsPerTool": 5
        },
        "outputFile": "comprehensive-mcp-tests.json"
      }
    },
    "id": 1
  }'
```

## Supported MCP Server Types

### Local Development Servers
```json
{
  "baseUrl": "http://localhost:3001",
  "path": "/mcp"
}
```

### Remote Production Servers
```json
{
  "baseUrl": "https://api.example.com",
  "path": "/v1/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

### Custom Enterprise Servers
```json
{
  "baseUrl": "https://enterprise.company.com",
  "path": "/api/mcp",
  "headers": {
    "X-API-Key": "YOUR_KEY",
    "X-Client-ID": "CLIENT_ID"
  },
  "timeout": 60000
}
```

## MCP Methods Supported

- `tools/list` - List available tools
- `tools/call` - Execute a tool with arguments
- `resources/list` - List available resources
- `resources/read` - Read a specific resource
- `prompts/list` - List available prompts
- `prompts/get` - Get a specific prompt
- `initialize` - Initialize the MCP server
- `ping` - Health check

## Response Format

All MCP testing tools return structured JSON responses:

```json
{
  "success": true,
  "server": {
    "baseUrl": "http://localhost:3001",
    "endpoint": "http://localhost:3001/mcp",
    "available": true
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "totalTools": 10,
    "totalResources": 3
  },
  "tools": [
    {
      "name": "search",
      "description": "Search for items",
      "hasSchema": true,
      "requiredParams": ["query"],
      "parameters": ["query", "limit"]
    }
  ],
  "resources": [
    {
      "uri": "mcp://server/guide",
      "name": "User Guide",
      "description": "Complete user guide",
      "mimeType": "text/markdown"
    }
  ]
}
```

## Error Handling

MCP testing includes comprehensive error detection:

- Connection failures
- Invalid JSON-RPC format
- Method not found errors
- Invalid parameters
- Timeout handling
- SSE parsing errors

## Test Assertions

You can add assertions to validate MCP responses:

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "test_mcp_endpoint",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "tools/list",
        "assertions": [
          {
            "type": "json_path",
            "path": "$.result.tools",
            "operator": "is_array"
          },
          {
            "type": "contains",
            "expected": "search"
          }
        ]
      }
    },
    "id": 1
  }'
```

## Integration with Claude

These MCP testing tools are designed to work seamlessly with Claude Code and Claude Desktop:

1. **Discovery**: Claude can automatically discover MCP server capabilities
2. **Testing**: Claude can test individual endpoints or generate comprehensive test suites
3. **Validation**: Claude can validate responses against expected formats
4. **Documentation**: Claude can access the built-in MCP protocol guide

## Examples

### Testing Your Own MCP Server

If you're developing an MCP server, use these tools to:

1. Verify your server implements the MCP protocol correctly
2. Test all your tools and resources
3. Generate test suites for CI/CD
4. Validate error handling

### Testing Third-Party MCP Servers

For external MCP servers:

1. Discover available capabilities
2. Test authentication and authorization
3. Verify response formats
4. Monitor performance and reliability

## Troubleshooting

### Connection Refused
- Check if the MCP server is running
- Verify the correct port number
- Check firewall settings

### Method Not Found
- Use `discover_mcp_server` to see available methods
- Check server documentation for supported methods

### SSE Parsing Errors
- Ensure the server returns proper SSE format
- Check for network proxies that might interfere with streaming

### Authentication Failures
- Verify API keys or tokens are correct
- Check header names and formats
- Ensure credentials have necessary permissions