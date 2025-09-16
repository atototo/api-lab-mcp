#!/usr/bin/env node

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ApiTestingService } from '../core/services/ApiTestingService.js';
import { HttpTestClient } from '../http/HttpTestClient.js';
import { ValidationService } from '../core/services/ValidationService.js';
import { ConfigManager } from '../core/services/ConfigManager.js';
import { TestWithAssertions, testWithAssertionsToolDefinition } from './tools/testWithAssertions.js';
import { setAuthConfigTool, handleSetAuthConfig } from './tools/setAuthConfig.js';
import { testWithAuthTool, handleTestWithAuth } from './tools/testWithAuth.js';
import { loadConfigTool, handleLoadConfig } from './tools/loadConfig.js';
import { setEnvironmentTool, handleSetEnvironment } from './tools/setEnvironment.js';
import { batchTestTool, handleBatchTest } from './tools/batchTest.js';
import { analyzeApiSpecTool, handleAnalyzeApiSpec } from './tools/analyzeApiSpec.js';
import { generateTestScenariosTool, handleGenerateTestScenarios } from './tools/generateTestScenarios.js';
import { discoverMcpServerTool, handleDiscoverMcpServer } from './tools/discoverMcpServer.js';
import { testMcpEndpointTool, handleTestMcpEndpoint } from './tools/testMcpEndpoint.js';
import { generateMcpTestsTool, handleGenerateMcpTests } from './tools/generateMcpTests.js';
import { mcpProtocolGuideResource, getMcpProtocolGuideContent } from './resources/mcpProtocolGuide.js';

class MCPHttpServer {
  private app: express.Application;
  private apiTestingService: ApiTestingService;
  private testWithAssertions: TestWithAssertions;
  private httpClient: HttpTestClient;
  private validationService: ValidationService;
  private configManager: ConfigManager;
  private tools: any[];

  constructor() {
    this.app = express();
    this.app.use(express.json());
    
    // Initialize services
    this.apiTestingService = new ApiTestingService();
    this.testWithAssertions = new TestWithAssertions();
    this.httpClient = new HttpTestClient();
    this.validationService = new ValidationService();
    this.configManager = new ConfigManager();
    
    // Define available tools
    this.tools = this.getAvailableTools();
    
    // Setup routes
    this.setupRoutes();
  }

  private getAvailableTools(): any[] {
    return [
      {
        name: 'test_http_endpoint',
        description: 'Test an HTTP endpoint with various methods and options',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
              description: 'HTTP method to use',
              default: 'GET',
            },
            url: {
              type: 'string',
              description: 'Full URL to test (e.g., https://api.example.com/endpoint)',
            },
            headers: {
              type: 'object',
              description: 'HTTP headers as key-value pairs',
              additionalProperties: {
                type: 'string',
              },
            },
            body: {
              type: ['object', 'string', 'null'],
              description: 'Request body (for POST, PUT, PATCH)',
            },
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds',
              default: 30000,
            },
            auth: {
              type: 'object',
              description: 'Authentication configuration',
              properties: {
                type: {
                  type: 'string',
                  enum: ['bearer', 'apikey', 'basic'],
                  description: 'Authentication type',
                },
                token: {
                  type: 'string',
                  description: 'Bearer token (for bearer auth)',
                },
                key: {
                  type: 'string',
                  description: 'API key (for apikey auth)',
                },
                keyName: {
                  type: 'string',
                  description: 'Header name for API key (default: X-API-Key)',
                },
                username: {
                  type: 'string',
                  description: 'Username (for basic auth)',
                },
                password: {
                  type: 'string',
                  description: 'Password (for basic auth)',
                },
              },
            },
          },
          required: ['url'],
        },
      },
      testWithAssertionsToolDefinition,
      setAuthConfigTool,
      testWithAuthTool,
      loadConfigTool,
      setEnvironmentTool,
      batchTestTool,
      analyzeApiSpecTool,
      generateTestScenariosTool,
      discoverMcpServerTool,
      testMcpEndpointTool,
      generateMcpTestsTool,
    ];
  }

  private setupRoutes(): void {
    // MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      // Check Accept header for SSE support
      const acceptHeader = req.get('Accept') || '';
      if (!acceptHeader.includes('text/event-stream') && !acceptHeader.includes('application/json')) {
        return res.status(406).json({
          jsonrpc: '2.0',
          id: 'server-error',
          error: {
            code: -32600,
            message: 'Not Acceptable: Client must accept both application/json and text/event-stream'
          }
        });
      }

      const { jsonrpc, method, params, id } = req.body;

      // Validate JSON-RPC request
      if (jsonrpc !== '2.0') {
        return this.sendError(res, id, -32600, 'Invalid Request: Must be JSON-RPC 2.0');
      }

      // Handle different methods
      try {
        switch (method) {
          case 'tools/list':
            return this.sendSseResponse(res, id, {
              tools: this.tools
            });

          case 'tools/call':
            const toolResult = await this.handleToolCall(params);
            return this.sendSseResponse(res, id, toolResult);

          case 'resources/list':
            return this.sendSseResponse(res, id, {
              resources: [mcpProtocolGuideResource]
            });

          case 'resources/read':
            if (params?.uri === mcpProtocolGuideResource.uri) {
              return this.sendSseResponse(res, id, {
                contents: [{
                  uri: mcpProtocolGuideResource.uri,
                  mimeType: mcpProtocolGuideResource.mimeType,
                  text: getMcpProtocolGuideContent()
                }]
              });
            } else {
              return this.sendError(res, id, -32001, `Resource not found: ${params?.uri}`);
            }

          case 'initialize':
            return this.sendSseResponse(res, id, {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: 'api-forge',
                version: '0.1.0'
              }
            });

          case 'ping':
            return this.sendSseResponse(res, id, { pong: true });

          default:
            return this.sendError(res, id, -32601, `Method not found: ${method}`);
        }
      } catch (error) {
        console.error(`Error handling method ${method}:`, error);
        return this.sendError(res, id, -32603, 
          error instanceof Error ? error.message : 'Internal error');
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'api-forge-mcp' });
    });
  }

  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;

    switch (name) {
      case 'test_http_endpoint':
        return await this.handleHttpTest(args);
      
      case 'test_with_assertions':
        return await this.testWithAssertions.execute(args);
      
      case 'set_auth_config':
        return await handleSetAuthConfig(args, { httpClient: this.httpClient });
      
      case 'test_with_auth':
        return await handleTestWithAuth(args, { 
          httpClient: this.httpClient,
          validationService: this.validationService 
        });
      
      case 'load_config':
        return await handleLoadConfig(args, { 
          configManager: this.configManager,
          httpClient: this.httpClient
        });
      
      case 'set_environment':
        return await handleSetEnvironment(args, { 
          configManager: this.configManager,
          httpClient: this.httpClient
        });
      
      case 'batch_test':
        return await handleBatchTest(args, { httpClient: this.httpClient });
      
      case 'analyze_api_spec':
        return await handleAnalyzeApiSpec(args);
      
      case 'generate_test_scenarios':
        return await handleGenerateTestScenarios(args);
      
      case 'discover_mcp_server':
        return await handleDiscoverMcpServer(args);
      
      case 'test_mcp_endpoint':
        return await handleTestMcpEndpoint(args);
      
      case 'generate_mcp_tests':
        return await handleGenerateMcpTests(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleHttpTest(args: any): Promise<any> {
    const request = {
      method: args.method || 'GET',
      url: args.url,
      headers: args.headers || {},
      body: args.body,
      timeout: args.timeout || 30000,
      auth: args.auth,
    };

    const result = await this.apiTestingService.executeTest(request);
    
    return {
      success: result.success,
      request: {
        method: result.request.method,
        url: result.request.url,
        headers: result.request.headers,
        body: result.request.body,
      },
      response: result.response ? {
        status: result.response.status,
        statusText: result.response.statusText,
        headers: result.response.headers,
        body: result.response.body,
        metrics: {
          responseTime: `${result.response.responseTime}ms`,
          size: `${result.response.size} bytes`,
        },
      } : null,
      error: result.error || null,
      timestamp: result.timestamp,
      duration: `${result.duration}ms`,
    };
  }

  private sendSseResponse(res: express.Response, id: any, result: any): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = {
      jsonrpc: '2.0',
      id,
      result
    };

    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    res.end();
  }

  private sendError(res: express.Response, id: any, code: number, message: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };

    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    res.end();
  }

  start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`API Forge MCP HTTP server running on http://localhost:${port}/mcp`);
    });
  }
}

// Start HTTP server
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001', 10);
  const server = new MCPHttpServer();
  server.start(port);
}

export { MCPHttpServer };