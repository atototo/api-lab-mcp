import { OpenApiParser } from '../../core/services/OpenApiParser';
import fs from 'fs/promises';

export const analyzeApiSpecTool = {
  name: 'analyze_api_spec',
  description: 'Analyze OpenAPI/Swagger specification and extract endpoint information',
  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'URL or file path to OpenAPI/Swagger spec, or "inline" for inline JSON'
      },
      spec: {
        type: 'object',
        description: 'Inline OpenAPI/Swagger spec (when source is "inline")'
      },
      filter: {
        type: 'object',
        description: 'Filter options for analysis',
        properties: {
          tag: {
            type: 'string',
            description: 'Filter endpoints by tag'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
            description: 'Filter endpoints by HTTP method'
          },
          path: {
            type: 'string',
            description: 'Filter endpoints by path pattern'
          }
        }
      }
    },
    required: ['source']
  }
};

export async function handleAnalyzeApiSpec(args: any): Promise<any> {
  try {
    const { source, spec, filter } = args;
    
    // Load the spec
    let apiSpec: any;
    if (source === 'inline') {
      if (!spec) {
        throw new Error('Inline spec is required when source is "inline"');
      }
      apiSpec = spec;
    } else if (source.startsWith('http://') || source.startsWith('https://')) {
      // URL - fetch the spec
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch spec from URL: ${response.statusText}`);
      }
      apiSpec = await response.json();
    } else {
      // File path - read the spec
      try {
        const content = await fs.readFile(source, 'utf-8');
        apiSpec = JSON.parse(content);
      } catch (error) {
        throw new Error(`Failed to read spec file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Parse the spec
    const parser = new OpenApiParser();
    const parsed = await parser.parse(apiSpec);
    
    // Apply filters if provided
    let endpoints = parsed.endpoints;
    if (filter) {
      if (filter.tag) {
        endpoints = endpoints.filter(e => e.tags?.includes(filter.tag));
      }
      if (filter.method) {
        endpoints = endpoints.filter(e => e.method === filter.method);
      }
      if (filter.path) {
        endpoints = endpoints.filter(e => e.path.includes(filter.path));
      }
    }
    
    // Get coverage stats
    const coverage = parser.getCoverageStats();
    
    // Format the response
    return {
      success: true,
      spec: {
        title: parsed.info.title,
        version: parsed.info.version,
        description: parsed.info.description,
        servers: parsed.servers,
        openapi: parsed.openapi,
        swagger: parsed.swagger
      },
      statistics: {
        totalEndpoints: endpoints.length,
        totalPaths: coverage.totalPaths,
        methodDistribution: coverage.methodDistribution,
        tagDistribution: coverage.tagDistribution,
        securitySchemes: Object.keys(parsed.securitySchemes || {})
      },
      endpoints: endpoints.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        security: endpoint.security,
        parameters: endpoint.parameters.map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          type: p.schema?.type || 'any',
          description: p.description
        })),
        requestBody: endpoint.requestBody ? {
          required: endpoint.requestBody.required,
          contentType: endpoint.requestBody.contentType,
          hasSchema: !!endpoint.requestBody.schema
        } : undefined,
        responses: endpoint.responses.map(r => ({
          statusCode: r.statusCode,
          description: r.description,
          contentType: r.contentType
        }))
      })),
      schemas: Object.keys(parsed.schemas).map(name => ({
        name,
        type: parsed.schemas[name].type,
        hasProperties: !!parsed.schemas[name].properties,
        required: parsed.schemas[name].required || []
      }))
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze API spec',
      suggestion: 'Check that the spec file/URL is valid and accessible'
    };
  }
}