import { faker } from '@faker-js/faker';
import { 
  ParsedApiSpec, 
  ParsedEndpoint, 
  TestScenario, 
  TestSuite,
  ParsedParameter 
} from '../../types/openapi';

export class TestScenarioGenerator {
  private spec: ParsedApiSpec;
  private scenarios: TestScenario[] = [];
  private scenarioCounter = 0;

  constructor(spec: ParsedApiSpec) {
    this.spec = spec;
  }

  /**
   * Generate comprehensive test suite for the API
   */
  generateTestSuite(): TestSuite {
    this.scenarios = [];
    this.scenarioCounter = 0;

    // Generate scenarios for each endpoint
    for (const endpoint of this.spec.endpoints) {
      this.generateEndpointScenarios(endpoint);
    }

    // Sort scenarios by priority and dependencies
    this.scenarios = this.sortScenarios(this.scenarios);

    // Calculate metadata
    const metadata = this.calculateMetadata();

    return {
      id: `suite_${Date.now()}`,
      name: `${this.spec.info.title} Test Suite`,
      description: `Automated test suite for ${this.spec.info.title} v${this.spec.info.version}`,
      apiSpec: {
        title: this.spec.info.title,
        version: this.spec.info.version,
        baseUrl: this.spec.servers[0]?.url || ''
      },
      scenarios: this.scenarios,
      metadata,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate scenarios for a specific endpoint
   */
  private generateEndpointScenarios(endpoint: ParsedEndpoint): void {
    // 1. Happy Path scenarios
    this.generateHappyPathScenario(endpoint);

    // 2. Error handling scenarios
    this.generateErrorScenarios(endpoint);

    // 3. Boundary value scenarios
    this.generateBoundaryScenarios(endpoint);

    // 4. Security scenarios
    if (endpoint.security && endpoint.security.length > 0) {
      this.generateSecurityScenarios(endpoint);
    }

    // 5. Performance scenario (for critical endpoints)
    if (this.isCriticalEndpoint(endpoint)) {
      this.generatePerformanceScenario(endpoint);
    }
  }

  /**
   * Generate happy path scenario
   */
  private generateHappyPathScenario(endpoint: ParsedEndpoint): void {
    const scenario: TestScenario = {
      id: `scenario_${++this.scenarioCounter}`,
      name: `Happy Path: ${endpoint.method} ${endpoint.path}`,
      description: `Test successful ${endpoint.method} request to ${endpoint.path}`,
      category: 'happy_path',
      priority: 'high',
      endpoint: {
        path: endpoint.path,
        method: endpoint.method
      },
      request: this.generateValidRequest(endpoint),
      expectedResponse: this.generateExpectedResponse(endpoint, '200'),
      assertions: this.generateAssertions(endpoint, 'happy_path'),
      tags: endpoint.tags
    };

    this.scenarios.push(scenario);
  }

  /**
   * Generate error handling scenarios
   */
  private generateErrorScenarios(endpoint: ParsedEndpoint): void {
    // 400 Bad Request - Missing required parameters
    if (this.hasRequiredParameters(endpoint)) {
      const scenario: TestScenario = {
        id: `scenario_${++this.scenarioCounter}`,
        name: `Error: Missing Required Params - ${endpoint.method} ${endpoint.path}`,
        description: `Test 400 error when required parameters are missing`,
        category: 'error_handling',
        priority: 'high',
        endpoint: {
          path: endpoint.path,
          method: endpoint.method
        },
        request: this.generateInvalidRequest(endpoint, 'missing_required'),
        expectedResponse: {
          status: 400
        },
        assertions: [
          { type: 'status', expected: 400 }
        ],
        tags: endpoint.tags
      };
      this.scenarios.push(scenario);
    }

    // 401 Unauthorized - If endpoint requires auth
    if (endpoint.security && endpoint.security.length > 0) {
      const scenario: TestScenario = {
        id: `scenario_${++this.scenarioCounter}`,
        name: `Error: Unauthorized - ${endpoint.method} ${endpoint.path}`,
        description: `Test 401 error when authentication is missing`,
        category: 'error_handling',
        priority: 'high',
        endpoint: {
          path: endpoint.path,
          method: endpoint.method
        },
        request: this.generateValidRequest(endpoint),
        expectedResponse: {
          status: 401
        },
        assertions: [
          { type: 'status', expected: 401 }
        ],
        tags: endpoint.tags
      };
      this.scenarios.push(scenario);
    }

    // 404 Not Found - For path parameters
    if (this.hasPathParameters(endpoint)) {
      const scenario: TestScenario = {
        id: `scenario_${++this.scenarioCounter}`,
        name: `Error: Not Found - ${endpoint.method} ${endpoint.path}`,
        description: `Test 404 error for non-existent resource`,
        category: 'error_handling',
        priority: 'medium',
        endpoint: {
          path: endpoint.path,
          method: endpoint.method
        },
        request: this.generateNotFoundRequest(endpoint),
        expectedResponse: {
          status: 404
        },
        assertions: [
          { type: 'status', expected: 404 }
        ],
        tags: endpoint.tags
      };
      this.scenarios.push(scenario);
    }
  }

  /**
   * Generate boundary value scenarios
   */
  private generateBoundaryScenarios(endpoint: ParsedEndpoint): void {
    const boundaryParams = this.identifyBoundaryParameters(endpoint);
    
    for (const param of boundaryParams) {
      // Min value scenario
      if (param.schema?.minimum !== undefined) {
        const scenario: TestScenario = {
          id: `scenario_${++this.scenarioCounter}`,
          name: `Boundary: Min value for ${param.name} - ${endpoint.method} ${endpoint.path}`,
          description: `Test minimum boundary value for ${param.name}`,
          category: 'boundary',
          priority: 'medium',
          endpoint: {
            path: endpoint.path,
            method: endpoint.method
          },
          request: this.generateBoundaryRequest(endpoint, param, 'min'),
          expectedResponse: this.generateExpectedResponse(endpoint, '200'),
          assertions: this.generateAssertions(endpoint, 'boundary'),
          tags: endpoint.tags
        };
        this.scenarios.push(scenario);
      }

      // Max value scenario
      if (param.schema?.maximum !== undefined) {
        const scenario: TestScenario = {
          id: `scenario_${++this.scenarioCounter}`,
          name: `Boundary: Max value for ${param.name} - ${endpoint.method} ${endpoint.path}`,
          description: `Test maximum boundary value for ${param.name}`,
          category: 'boundary',
          priority: 'medium',
          endpoint: {
            path: endpoint.path,
            method: endpoint.method
          },
          request: this.generateBoundaryRequest(endpoint, param, 'max'),
          expectedResponse: this.generateExpectedResponse(endpoint, '200'),
          assertions: this.generateAssertions(endpoint, 'boundary'),
          tags: endpoint.tags
        };
        this.scenarios.push(scenario);
      }
    }
  }

  /**
   * Generate security scenarios
   */
  private generateSecurityScenarios(endpoint: ParsedEndpoint): void {
    // SQL Injection test
    if (this.hasStringParameters(endpoint)) {
      const scenario: TestScenario = {
        id: `scenario_${++this.scenarioCounter}`,
        name: `Security: SQL Injection - ${endpoint.method} ${endpoint.path}`,
        description: `Test SQL injection vulnerability`,
        category: 'security',
        priority: 'high',
        endpoint: {
          path: endpoint.path,
          method: endpoint.method
        },
        request: this.generateSecurityRequest(endpoint, 'sql_injection'),
        expectedResponse: {
          status: 400
        },
        assertions: [
          { type: 'status', expected: 400 },
          { type: 'not_contains', path: 'body', expected: 'SQL' }
        ],
        tags: [...(endpoint.tags || []), 'security']
      };
      this.scenarios.push(scenario);
    }

    // XSS test
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      const scenario: TestScenario = {
        id: `scenario_${++this.scenarioCounter}`,
        name: `Security: XSS - ${endpoint.method} ${endpoint.path}`,
        description: `Test XSS vulnerability`,
        category: 'security',
        priority: 'high',
        endpoint: {
          path: endpoint.path,
          method: endpoint.method
        },
        request: this.generateSecurityRequest(endpoint, 'xss'),
        expectedResponse: {
          status: 400
        },
        assertions: [
          { type: 'status', expected: 400 },
          { type: 'not_contains', path: 'body', expected: '<script>' }
        ],
        tags: [...(endpoint.tags || []), 'security']
      };
      this.scenarios.push(scenario);
    }
  }

  /**
   * Generate performance scenario
   */
  private generatePerformanceScenario(endpoint: ParsedEndpoint): void {
    const scenario: TestScenario = {
      id: `scenario_${++this.scenarioCounter}`,
      name: `Performance: Load Test - ${endpoint.method} ${endpoint.path}`,
      description: `Performance test for ${endpoint.path}`,
      category: 'performance',
      priority: 'low',
      endpoint: {
        path: endpoint.path,
        method: endpoint.method
      },
      request: this.generateValidRequest(endpoint),
      expectedResponse: {
        status: 200
      },
      assertions: [
        { type: 'status', expected: 200 },
        { type: 'response_time', operator: 'less_than', expected: 1000 }
      ],
      tags: [...(endpoint.tags || []), 'performance']
    };
    this.scenarios.push(scenario);
  }

  /**
   * Generate valid request data
   */
  private generateValidRequest(endpoint: ParsedEndpoint): TestScenario['request'] {
    const request: TestScenario['request'] = {};

    // Generate path parameters
    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    if (pathParams.length > 0) {
      request.params = {};
      for (const param of pathParams) {
        request.params[param.name] = this.generateValidValue(param.schema);
      }
    }

    // Generate query parameters
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
      request.query = {};
      for (const param of queryParams) {
        if (param.required || Math.random() > 0.5) {
          request.query[param.name] = this.generateValidValue(param.schema);
        }
      }
    }

    // Generate headers
    const headerParams = endpoint.parameters.filter(p => p.in === 'header');
    if (headerParams.length > 0) {
      request.headers = {};
      for (const param of headerParams) {
        if (param.required || Math.random() > 0.5) {
          request.headers[param.name] = this.generateValidValue(param.schema);
        }
      }
    }

    // Generate request body
    if (endpoint.requestBody) {
      request.body = this.generateValidBody(endpoint.requestBody.schema);
    }

    return request;
  }

  /**
   * Generate invalid request for error testing
   */
  private generateInvalidRequest(endpoint: ParsedEndpoint, type: string): TestScenario['request'] {
    const request = this.generateValidRequest(endpoint);

    if (type === 'missing_required') {
      // Remove required parameters
      const requiredParams = endpoint.parameters.filter(p => p.required);
      if (requiredParams.length > 0) {
        const paramToRemove = requiredParams[0];
        if (paramToRemove.in === 'query' && request.query) {
          delete request.query[paramToRemove.name];
        } else if (paramToRemove.in === 'path' && request.params) {
          request.params[paramToRemove.name] = '';
        }
      }
    }

    return request;
  }

  /**
   * Generate not found request
   */
  private generateNotFoundRequest(endpoint: ParsedEndpoint): TestScenario['request'] {
    const request = this.generateValidRequest(endpoint);
    
    // Use non-existent ID for path parameters
    if (request.params) {
      for (const key in request.params) {
        if (key.toLowerCase().includes('id')) {
          request.params[key] = '99999999';
        }
      }
    }

    return request;
  }

  /**
   * Generate boundary request
   */
  private generateBoundaryRequest(
    endpoint: ParsedEndpoint, 
    param: ParsedParameter, 
    type: 'min' | 'max'
  ): TestScenario['request'] {
    const request = this.generateValidRequest(endpoint);
    const value = type === 'min' ? param.schema.minimum : param.schema.maximum;

    if (param.in === 'query' && request.query) {
      request.query[param.name] = value;
    } else if (param.in === 'path' && request.params) {
      request.params[param.name] = value;
    }

    return request;
  }

  /**
   * Generate security test request
   */
  private generateSecurityRequest(endpoint: ParsedEndpoint, type: string): TestScenario['request'] {
    const request = this.generateValidRequest(endpoint);
    
    const payloads: Record<string, string> = {
      sql_injection: "' OR '1'='1",
      xss: "<script>alert('XSS')</script>",
      command_injection: "; ls -la",
      path_traversal: "../../../etc/passwd"
    };

    const payload = payloads[type];

    // Inject payload into string parameters
    if (request.query) {
      for (const key in request.query) {
        if (typeof request.query[key] === 'string') {
          request.query[key] = payload;
          break;
        }
      }
    }

    if (request.body && typeof request.body === 'object') {
      for (const key in request.body) {
        if (typeof request.body[key] === 'string') {
          request.body[key] = payload;
          break;
        }
      }
    }

    return request;
  }

  /**
   * Generate expected response
   */
  private generateExpectedResponse(endpoint: ParsedEndpoint, statusCode: string): TestScenario['expectedResponse'] {
    const response = endpoint.responses.find(r => r.statusCode === statusCode);
    
    return {
      status: parseInt(statusCode),
      headers: response?.contentType ? { 'content-type': response.contentType } : undefined
    };
  }

  /**
   * Generate assertions
   */
  private generateAssertions(endpoint: ParsedEndpoint, category: string): TestScenario['assertions'] {
    const assertions: TestScenario['assertions'] = [
      { type: 'status', expected: 200 }
    ];

    // Add response time assertion for performance tests
    if (category === 'performance') {
      assertions.push({ 
        type: 'response_time', 
        operator: 'less_than', 
        expected: 1000 
      });
    }

    // Add content type assertion
    const response = endpoint.responses.find(r => r.statusCode === '200');
    if (response?.contentType) {
      assertions.push({
        type: 'header',
        path: 'content-type',
        operator: 'contains',
        expected: response.contentType
      });
    }

    // Add schema validation if available
    if (response?.schema) {
      assertions.push({
        type: 'json_schema',
        expected: response.schema
      });
    }

    return assertions;
  }

  /**
   * Generate valid value based on schema
   */
  private generateValidValue(schema: any): any {
    if (!schema) return faker.string.sample();

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return faker.helpers.arrayElement(schema.enum);
        }
        if (schema.format === 'email') {
          return faker.internet.email();
        }
        if (schema.format === 'uuid') {
          return faker.string.uuid();
        }
        if (schema.format === 'date') {
          return faker.date.recent().toISOString().split('T')[0];
        }
        if (schema.format === 'date-time') {
          return faker.date.recent().toISOString();
        }
        if (schema.pattern) {
          // Simple pattern handling
          return faker.string.alphanumeric(10);
        }
        return faker.string.alpha({ length: schema.minLength || 10 });

      case 'integer':
      case 'number':
        const min = schema.minimum || 1;
        const max = schema.maximum || 1000;
        return faker.number.int({ min, max });

      case 'boolean':
        return faker.datatype.boolean();

      case 'array':
        const itemCount = faker.number.int({ min: 1, max: 5 });
        return Array(itemCount).fill(null).map(() => 
          this.generateValidValue(schema.items)
        );

      case 'object':
        return this.generateValidBody(schema);

      default:
        return faker.string.sample();
    }
  }

  /**
   * Generate valid request body
   */
  private generateValidBody(schema: any): any {
    if (!schema || !schema.properties) {
      return {};
    }

    const body: any = {};
    const required = schema.required || [];

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Include required fields and randomly include optional ones
      if (required.includes(key) || Math.random() > 0.5) {
        body[key] = this.generateValidValue(propSchema);
      }
    }

    return body;
  }

  /**
   * Helper methods
   */
  private hasRequiredParameters(endpoint: ParsedEndpoint): boolean {
    return endpoint.parameters.some(p => p.required);
  }

  private hasPathParameters(endpoint: ParsedEndpoint): boolean {
    return endpoint.parameters.some(p => p.in === 'path');
  }

  private hasStringParameters(endpoint: ParsedEndpoint): boolean {
    return endpoint.parameters.some(p => p.schema?.type === 'string');
  }

  private identifyBoundaryParameters(endpoint: ParsedEndpoint): ParsedParameter[] {
    return endpoint.parameters.filter(p => 
      p.schema?.minimum !== undefined || p.schema?.maximum !== undefined
    );
  }

  private isCriticalEndpoint(endpoint: ParsedEndpoint): boolean {
    // Consider login, payment, and user endpoints as critical
    const criticalPaths = ['login', 'auth', 'payment', 'user', 'checkout'];
    return criticalPaths.some(path => endpoint.path.toLowerCase().includes(path));
  }

  /**
   * Sort scenarios by priority and dependencies
   */
  private sortScenarios(scenarios: TestScenario[]): TestScenario[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return scenarios.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by category (happy_path first)
      if (a.category === 'happy_path' && b.category !== 'happy_path') return -1;
      if (a.category !== 'happy_path' && b.category === 'happy_path') return 1;
      
      return 0;
    });
  }

  /**
   * Calculate metadata for the test suite
   */
  private calculateMetadata(): TestSuite['metadata'] {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const testedEndpoints = new Set<string>();

    for (const scenario of this.scenarios) {
      // Count by category
      byCategory[scenario.category] = (byCategory[scenario.category] || 0) + 1;
      
      // Count by priority
      byPriority[scenario.priority] = (byPriority[scenario.priority] || 0) + 1;
      
      // Track tested endpoints
      testedEndpoints.add(`${scenario.endpoint.method} ${scenario.endpoint.path}`);
    }

    return {
      totalScenarios: this.scenarios.length,
      byCategory,
      byPriority,
      coverage: {
        endpoints: testedEndpoints.size,
        totalEndpoints: this.spec.endpoints.length,
        percentage: Math.round((testedEndpoints.size / this.spec.endpoints.length) * 100)
      }
    };
  }
}