#!/bin/bash

# Test script for MCP protocol features
# This script tests the new MCP tools we've implemented

echo "========================================"
echo "Testing MCP Protocol Features"
echo "========================================"
echo ""

# Base URL for our API Forge MCP server
API_FORGE_URL="http://localhost:3001/mcp"

# Test 1: Discover MCP Server (localhost example)
echo "Test 1: Discovering local MCP server..."
echo "----------------------------------------"
curl -X POST $API_FORGE_URL \
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
    "id": "test-discover-1"
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 2: Test MCP Endpoint - List Tools
echo "Test 2: Testing MCP endpoint (tools/list)..."
echo "--------------------------------------------"
curl -X POST $API_FORGE_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "tools/list"
      }
    },
    "id": "test-endpoint-1"
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 3: Test MCP Endpoint - List Resources
echo "Test 3: Testing MCP endpoint (resources/list)..."
echo "------------------------------------------------"
curl -X POST $API_FORGE_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "test_mcp_endpoint",
      "arguments": {
        "url": "http://localhost:3001/mcp",
        "method": "resources/list"
      }
    },
    "id": "test-endpoint-2"
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 4: Generate MCP Tests
echo "Test 4: Generating MCP test suite..."
echo "------------------------------------"
curl -X POST $API_FORGE_URL \
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
          "includeErrorTests": false,
          "maxTestsPerTool": 2
        }
      }
    },
    "id": "test-generate-1"
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 5: Read MCP Protocol Guide Resource
echo "Test 5: Reading MCP protocol guide resource..."
echo "----------------------------------------------"
curl -X POST $API_FORGE_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "mcp://api-forge/protocol-guide"
    },
    "id": "test-resource-1"
  }' 2>/dev/null | jq '.contents[0].text' -r | head -20

echo ""
echo "========================================"
echo "MCP Protocol Testing Complete!"
echo "========================================"