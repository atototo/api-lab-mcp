import { OpenAPIV3 } from 'openapi-types';

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: any[];
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: ParsedResponse[];
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: any;
  description?: string;
  example?: any;
}

export interface ParsedRequestBody {
  required: boolean;
  contentType: string;
  schema: any;
  examples?: Record<string, any>;
}

export interface ParsedResponse {
  statusCode: string;
  description: string;
  contentType?: string;
  schema?: any;
  examples?: Record<string, any>;
}

export interface ParsedSchema {
  name: string;
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  example?: any;
}

export interface ParsedApiSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{
    url: string;
    description?: string;
    variables?: Record<string, any>;
  }>;
  endpoints: ParsedEndpoint[];
  schemas: Record<string, ParsedSchema>;
  securitySchemes?: Record<string, any>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'happy_path' | 'error_handling' | 'boundary' | 'security' | 'performance';
  priority: 'high' | 'medium' | 'low';
  endpoint: {
    path: string;
    method: string;
  };
  request: {
    params?: Record<string, any>;
    query?: Record<string, any>;
    headers?: Record<string, any>;
    body?: any;
  };
  expectedResponse: {
    status: number;
    body?: any;
    headers?: Record<string, any>;
  };
  assertions?: Array<{
    type: string;
    path?: string;
    expected?: any;
    operator?: string;
  }>;
  dependencies?: string[];
  tags?: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  apiSpec: {
    title: string;
    version: string;
    baseUrl: string;
  };
  scenarios: TestScenario[];
  metadata: {
    totalScenarios: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    coverage: {
      endpoints: number;
      totalEndpoints: number;
      percentage: number;
    };
  };
  createdAt: string;
}