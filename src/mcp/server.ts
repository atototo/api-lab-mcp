#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ApiTestingService } from '../core/services/ApiTestingService.js';
import { HttpTestClient } from '../http/HttpTestClient.js';
import { ValidationService } from '../core/services/ValidationService.js';
import { ConfigManager } from '../core/services/ConfigManager.js';
import { HttpTestRequest } from '../types/index.js';
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
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { mcpProtocolGuideResource, getMcpProtocolGuideContent } from './resources/mcpProtocolGuide.js';

class MCPApiTestingServer {
  private server: Server;
  private apiTestingService: ApiTestingService;
  private testWithAssertions: TestWithAssertions;
  private httpClient: HttpTestClient;
  private validationService: ValidationService;
  private configManager: ConfigManager;

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'api-forge',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize services
    this.apiTestingService = new ApiTestingService();
    this.testWithAssertions = new TestWithAssertions();
    this.httpClient = new HttpTestClient();
    this.validationService = new ValidationService();
    this.configManager = new ConfigManager();

    // Setup handlers
    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Error handling
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'test_http_endpoint':
            return await this.handleHttpTest(args);
          
          case 'test_with_assertions':
            return await this.handleTestWithAssertions(args);
          
          case 'set_auth_config':
            return await this.handleSetAuthConfig(args);
          
          case 'test_with_auth':
            return await this.handleTestWithAuth(args);
          
          case 'load_config':
            return await this.handleLoadConfig(args);
          
          case 'set_environment':
            return await this.handleSetEnvironment(args);
          
          case 'batch_test':
            return await this.handleBatchTest(args);
          
          case 'analyze_api_spec':
            return await this.handleAnalyzeApiSpec(args);
          
          case 'generate_test_scenarios':
            return await this.handleGenerateTestScenarios(args);
          
          case 'discover_mcp_server':
            return await this.handleDiscoverMcpServer(args);
          
          case 'test_mcp_endpoint':
            return await this.handleTestMcpEndpoint(args);
          
          case 'generate_mcp_tests':
            return await this.handleGenerateMcpTests(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                tool: name,
              }, null, 2),
            },
          ],
        };
      }
    });
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

  private async handleHttpTest(args: any): Promise<any> {
    // Validate and prepare request
    const request: HttpTestRequest = {
      method: args.method || 'GET',
      url: args.url,
      headers: args.headers || {},
      body: args.body,
      timeout: args.timeout || 30000,
      auth: args.auth,
    };

    // Execute test
    const result = await this.apiTestingService.executeTest(request);

    // Format response for Claude
    const formattedResult = {
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedResult, null, 2),
        },
      ],
    };
  }

  private async handleTestWithAssertions(args: any): Promise<any> {
    const result = await this.testWithAssertions.execute(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSetAuthConfig(args: any): Promise<any> {
    const result = await handleSetAuthConfig(args, { 
      httpClient: this.httpClient 
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleTestWithAuth(args: any): Promise<any> {
    const result = await handleTestWithAuth(args, { 
      httpClient: this.httpClient,
      validationService: this.validationService 
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleLoadConfig(args: any): Promise<any> {
    const result = await handleLoadConfig(args, { 
      configManager: this.configManager,
      httpClient: this.httpClient
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSetEnvironment(args: any): Promise<any> {
    const result = await handleSetEnvironment(args, { 
      configManager: this.configManager,
      httpClient: this.httpClient
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleBatchTest(args: any): Promise<any> {
    const result = await handleBatchTest(args, { 
      httpClient: this.httpClient
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeApiSpec(args: any): Promise<any> {
    const result = await handleAnalyzeApiSpec(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGenerateTestScenarios(args: any): Promise<any> {
    const result = await handleGenerateTestScenarios(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleDiscoverMcpServer(args: any): Promise<any> {
    const result = await handleDiscoverMcpServer(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleTestMcpEndpoint(args: any): Promise<any> {
    const result = await handleTestMcpEndpoint(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGenerateMcpTests(args: any): Promise<any> {
    const result = await handleGenerateMcpTests(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private setupResourceHandlers(): void {
    // Handle resource list requests
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        mcpProtocolGuideResource
      ],
    }));

    // Handle resource read requests
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === mcpProtocolGuideResource.uri) {
        return {
          contents: [
            {
              uri: mcpProtocolGuideResource.uri,
              mimeType: mcpProtocolGuideResource.mimeType,
              text: getMcpProtocolGuideContent(),
            },
          ],
        };
      }

      throw new Error(`Resource not found: ${uri}`);
    });
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('API Forge MCP server started successfully');
  }
}

// Main execution
const server = new MCPApiTestingServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});