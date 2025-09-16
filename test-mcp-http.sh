#!/bin/bash

# Test script for MCP HTTP server with SSE response handling
# This script tests the MCP tools via HTTP

echo "========================================"
echo "Testing MCP HTTP Server"
echo "========================================"
echo ""

# Base URL for our API Forge MCP HTTP server
MCP_URL="http://localhost:3001/mcp"

# Helper function to extract data from SSE response
extract_sse_data() {
    grep "^data: " | sed 's/^data: //'
}

# Test 1: List available tools
echo "Test 1: Listing available MCP tools..."
echo "----------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": "test-1"
  }' | extract_sse_data | jq '.result.tools[] | .name' | head -5

echo ""
echo ""

# Test 2: Discover MCP Server
echo "Test 2: Testing discover_mcp_server tool..."
echo "--------------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "discover_mcp_server",
      "arguments": {
        "baseUrl": "http://localhost:3001"
      }
    },
    "id": "test-2"
  }' | extract_sse_data | jq '.result | {success: .success, endpoint: .server.endpoint, tools: .capabilities.totalTools}'

echo ""
echo ""

# Test 3: Test MCP Endpoint
echo "Test 3: Testing test_mcp_endpoint tool..."
echo "------------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "ping"
      }
    },
    "id": "test-3"
  }' | extract_sse_data | jq '.result | {success: .success, method: .request.method}'

echo ""
echo ""

# Test 4: List Resources
echo "Test 4: Listing available resources..."
echo "---------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": "test-4"
  }' | extract_sse_data | jq '.result.resources[] | {name: .name, uri: .uri}'

echo ""
echo ""

# Test 5: Generate MCP Tests
echo "Test 5: Testing generate_mcp_tests tool..."
echo "-------------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "generate_mcp_tests",
      "arguments": {
        "baseUrl": "http://localhost:3001",
        "options": {
          "includeProtocolTests": true,
          "maxTestsPerTool": 1
        }
      }
    },
    "id": "test-5"
  }' | extract_sse_data | jq '.result | {success: .success, scenarios: .summary.total, tools: (.summary.tools | length)}'

echo ""
echo ""

# Test 6: Initialize
echo "Test 6: Testing initialize method..."
echo "-------------------------------------"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": "test-6"
  }' | extract_sse_data | jq '.result.serverInfo'

echo ""
echo "========================================"
echo "MCP HTTP Server Testing Complete!"
echo "========================================"