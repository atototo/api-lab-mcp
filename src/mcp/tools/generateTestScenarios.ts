import { OpenApiParser } from '../../core/services/OpenApiParser';
import { TestScenarioGenerator } from '../../core/services/TestScenarioGenerator';
import fs from 'fs/promises';

export const generateTestScenariosTool = {
  name: 'generate_test_scenarios',
  description: 'Generate comprehensive test scenarios from OpenAPI/Swagger specification',
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
      options: {
        type: 'object',
        description: 'Test generation options',
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['happy_path', 'error_handling', 'boundary', 'security', 'performance']
            },
            description: 'Categories of tests to generate (default: all)'
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'all'],
            description: 'Minimum priority level for scenarios (default: all)'
          },
          maxScenariosPerEndpoint: {
            type: 'number',
            description: 'Maximum scenarios to generate per endpoint'
          },
          includeAuth: {
            type: 'boolean',
            description: 'Include authentication test scenarios'
          },
          includeSecurity: {
            type: 'boolean',
            description: 'Include security vulnerability test scenarios'
          }
        }
      },
      outputFile: {
        type: 'string',
        description: 'Optional: Save test suite to file'
      }
    },
    required: ['source']
  }
};

export async function handleGenerateTestScenarios(args: any): Promise<any> {
  try {
    const { source, spec, options = {}, outputFile } = args;
    
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
    
    // Generate test scenarios
    const generator = new TestScenarioGenerator(parsed);
    const testSuite = generator.generateTestSuite();
    
    // Apply filters based on options
    let scenarios = testSuite.scenarios;
    
    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      scenarios = scenarios.filter(s => options.categories.includes(s.category));
    }
    
    // Filter by priority
    if (options.priority && options.priority !== 'all') {
      const priorityLevels = { high: 0, medium: 1, low: 2 };
      const minPriority = priorityLevels[options.priority as keyof typeof priorityLevels];
      scenarios = scenarios.filter(s => 
        priorityLevels[s.priority as keyof typeof priorityLevels] <= minPriority
      );
    }
    
    // Limit scenarios per endpoint
    if (options.maxScenariosPerEndpoint) {
      const endpointCounts: Record<string, number> = {};
      scenarios = scenarios.filter(s => {
        const key = `${s.endpoint.method}_${s.endpoint.path}`;
        endpointCounts[key] = (endpointCounts[key] || 0) + 1;
        return endpointCounts[key] <= options.maxScenariosPerEndpoint;
      });
    }
    
    // Filter out auth/security scenarios if requested
    if (options.includeAuth === false) {
      scenarios = scenarios.filter(s => 
        s.name.toLowerCase().indexOf('auth') === -1 &&
        s.name.toLowerCase().indexOf('unauthorized') === -1
      );
    }
    
    if (options.includeSecurity === false) {
      scenarios = scenarios.filter(s => s.category !== 'security');
    }
    
    // Update test suite with filtered scenarios
    testSuite.scenarios = scenarios;
    
    // Recalculate metadata
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const testedEndpoints = new Set<string>();
    
    for (const scenario of scenarios) {
      byCategory[scenario.category] = (byCategory[scenario.category] || 0) + 1;
      byPriority[scenario.priority] = (byPriority[scenario.priority] || 0) + 1;
      testedEndpoints.add(`${scenario.endpoint.method} ${scenario.endpoint.path}`);
    }
    
    testSuite.metadata = {
      totalScenarios: scenarios.length,
      byCategory,
      byPriority,
      coverage: {
        endpoints: testedEndpoints.size,
        totalEndpoints: parsed.endpoints.length,
        percentage: Math.round((testedEndpoints.size / parsed.endpoints.length) * 100)
      }
    };
    
    // Save to file if requested
    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(testSuite, null, 2), 'utf-8');
    }
    
    // Format the response
    return {
      success: true,
      testSuite: {
        id: testSuite.id,
        name: testSuite.name,
        description: testSuite.description,
        apiSpec: testSuite.apiSpec,
        metadata: testSuite.metadata,
        createdAt: testSuite.createdAt
      },
      scenarios: scenarios.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        priority: s.priority,
        endpoint: s.endpoint,
        hasAuth: !!s.dependencies?.some(d => d.includes('auth')),
        assertions: s.assertions?.length || 0
      })),
      summary: {
        total: scenarios.length,
        byCategory: testSuite.metadata.byCategory,
        byPriority: testSuite.metadata.byPriority,
        coverage: testSuite.metadata.coverage
      },
      ...(outputFile && { savedTo: outputFile })
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate test scenarios',
      suggestion: 'Check that the spec is valid and try adjusting generation options'
    };
  }
}