import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { 
  ParsedApiSpec, 
  ParsedEndpoint, 
  ParsedParameter, 
  ParsedRequestBody, 
  ParsedResponse,
  ParsedSchema 
} from '../../types/openapi';

export class OpenApiParser {
  private api: any;

  constructor() {}

  /**
   * Parse OpenAPI/Swagger specification from file, URL, or object
   */
  async parse(input: string | object): Promise<ParsedApiSpec> {
    try {
      // Parse and validate the OpenAPI spec
      this.api = await SwaggerParser.validate(input as any);
      
      // Extract and transform the spec
      return this.transformSpec();
    } catch (error) {
      throw new Error(`Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Transform raw OpenAPI spec to our ParsedApiSpec format
   */
  private transformSpec(): ParsedApiSpec {
    const isOpenApi3 = 'openapi' in this.api;
    
    return {
      openapi: isOpenApi3 ? this.api.openapi : undefined,
      swagger: !isOpenApi3 ? this.api.swagger : undefined,
      info: {
        title: this.api.info.title,
        version: this.api.info.version,
        description: this.api.info.description
      },
      servers: this.extractServers(),
      endpoints: this.extractEndpoints(),
      schemas: this.extractSchemas(),
      securitySchemes: this.extractSecuritySchemes(),
      tags: this.api.tags || []
    };
  }

  /**
   * Extract server information
   */
  private extractServers(): ParsedApiSpec['servers'] {
    if (this.api.servers) {
      // OpenAPI 3.x
      return this.api.servers.map((server: any) => ({
        url: server.url,
        description: server.description,
        variables: server.variables
      }));
    } else if (this.api.host) {
      // Swagger 2.0
      const schemes = this.api.schemes || ['http'];
      const basePath = this.api.basePath || '';
      return schemes.map((scheme: string) => ({
        url: `${scheme}://${this.api.host}${basePath}`,
        description: `${scheme.toUpperCase()} Server`
      }));
    }
    return [{ url: 'http://localhost', description: 'Default Server' }];
  }

  /**
   * Extract all endpoints
   */
  private extractEndpoints(): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    const paths = this.api.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      
      for (const method of methods) {
        const operation = (pathItem as any)[method];
        if (!operation) continue;

        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags,
          security: operation.security || this.api.security,
          parameters: this.extractParameters(operation, pathItem),
          requestBody: this.extractRequestBody(operation),
          responses: this.extractResponses(operation)
        });
      }
    }

    return endpoints;
  }

  /**
   * Extract parameters for an endpoint
   */
  private extractParameters(operation: any, pathItem: any): ParsedParameter[] {
    const parameters: ParsedParameter[] = [];
    
    // Combine path-level and operation-level parameters
    const allParams = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || [])
    ];

    for (const param of allParams) {
      // Skip if it's a reference we can't resolve
      if (param.$ref) {
        const resolved = this.resolveRef(param.$ref);
        if (resolved) {
          parameters.push(this.transformParameter(resolved));
        }
      } else {
        parameters.push(this.transformParameter(param));
      }
    }

    return parameters;
  }

  /**
   * Transform a parameter to our format
   */
  private transformParameter(param: any): ParsedParameter {
    return {
      name: param.name,
      in: param.in,
      required: param.required || false,
      schema: param.schema || { type: param.type },
      description: param.description,
      example: param.example || param.schema?.example
    };
  }

  /**
   * Extract request body
   */
  private extractRequestBody(operation: any): ParsedRequestBody | undefined {
    if (!operation.requestBody) {
      // Check for body parameters in Swagger 2.0
      const bodyParam = operation.parameters?.find((p: any) => p.in === 'body');
      if (bodyParam) {
        return {
          required: bodyParam.required || false,
          contentType: 'application/json',
          schema: bodyParam.schema,
          examples: bodyParam.examples
        };
      }
      return undefined;
    }

    // OpenAPI 3.x
    const content = operation.requestBody.content || {};
    const contentType = Object.keys(content)[0] || 'application/json';
    const mediaType = content[contentType] || {};

    return {
      required: operation.requestBody.required || false,
      contentType,
      schema: mediaType.schema,
      examples: mediaType.examples
    };
  }

  /**
   * Extract responses
   */
  private extractResponses(operation: any): ParsedResponse[] {
    const responses: ParsedResponse[] = [];
    
    for (const [statusCode, response] of Object.entries(operation.responses || {})) {
      const resp = response as any;
      
      let contentType: string | undefined;
      let schema: any;
      let examples: any;

      if (resp.content) {
        // OpenAPI 3.x
        const content = resp.content;
        contentType = Object.keys(content)[0];
        const mediaType = content[contentType];
        schema = mediaType?.schema;
        examples = mediaType?.examples;
      } else if (resp.schema) {
        // Swagger 2.0
        contentType = 'application/json';
        schema = resp.schema;
        examples = resp.examples;
      }

      responses.push({
        statusCode,
        description: resp.description || '',
        contentType,
        schema,
        examples
      });
    }

    return responses;
  }

  /**
   * Extract schemas/definitions
   */
  private extractSchemas(): Record<string, ParsedSchema> {
    const schemas: Record<string, ParsedSchema> = {};
    
    // OpenAPI 3.x
    if (this.api.components?.schemas) {
      for (const [name, schema] of Object.entries(this.api.components.schemas)) {
        schemas[name] = this.transformSchema(name, schema);
      }
    }
    
    // Swagger 2.0
    if (this.api.definitions) {
      for (const [name, schema] of Object.entries(this.api.definitions)) {
        schemas[name] = this.transformSchema(name, schema);
      }
    }

    return schemas;
  }

  /**
   * Transform a schema to our format
   */
  private transformSchema(name: string, schema: any): ParsedSchema {
    return {
      name,
      type: schema.type || 'object',
      properties: schema.properties,
      required: schema.required,
      example: schema.example
    };
  }

  /**
   * Extract security schemes
   */
  private extractSecuritySchemes(): Record<string, any> | undefined {
    // OpenAPI 3.x
    if (this.api.components?.securitySchemes) {
      return this.api.components.securitySchemes;
    }
    
    // Swagger 2.0
    if (this.api.securityDefinitions) {
      return this.api.securityDefinitions;
    }

    return undefined;
  }

  /**
   * Resolve a $ref reference
   */
  private resolveRef(ref: string): any {
    const parts = ref.split('/');
    let current = this.api;
    
    for (let i = 1; i < parts.length; i++) {
      current = current[parts[i]];
      if (!current) return null;
    }
    
    return current;
  }

  /**
   * Get endpoint by path and method
   */
  getEndpoint(path: string, method: string): ParsedEndpoint | undefined {
    const spec = this.transformSpec();
    return spec.endpoints.find(
      e => e.path === path && e.method === method.toUpperCase()
    );
  }

  /**
   * Get all endpoints with a specific tag
   */
  getEndpointsByTag(tag: string): ParsedEndpoint[] {
    const spec = this.transformSpec();
    return spec.endpoints.filter(e => e.tags?.includes(tag));
  }

  /**
   * Calculate API coverage statistics
   */
  getCoverageStats(): {
    totalEndpoints: number;
    totalPaths: number;
    methodDistribution: Record<string, number>;
    tagDistribution: Record<string, number>;
  } {
    const spec = this.transformSpec();
    const methodDist: Record<string, number> = {};
    const tagDist: Record<string, number> = {};
    const uniquePaths = new Set<string>();

    for (const endpoint of spec.endpoints) {
      uniquePaths.add(endpoint.path);
      
      // Count methods
      methodDist[endpoint.method] = (methodDist[endpoint.method] || 0) + 1;
      
      // Count tags
      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          tagDist[tag] = (tagDist[tag] || 0) + 1;
        }
      }
    }

    return {
      totalEndpoints: spec.endpoints.length,
      totalPaths: uniquePaths.size,
      methodDistribution: methodDist,
      tagDistribution: tagDist
    };
  }
}