import { z } from 'zod';
import jsonpath from 'jsonpath';

export type AssertionType = 
  | 'status'
  | 'header'
  | 'body'
  | 'bodyJson'
  | 'bodyJsonPath'
  | 'responseTime'
  | 'contentType'
  | 'contains'
  | 'notContains'
  | 'matches';

export interface Assertion {
  type: AssertionType;
  path?: string;
  expected: any;
  operator?: 'equals' | 'contains' | 'lessThan' | 'greaterThan' | 'matches' | 'exists';
  message?: string;
}

export interface ValidationResult {
  passed: boolean;
  assertion: Assertion;
  actual?: any;
  error?: string;
  duration?: number;
}

export interface ValidationReport {
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  results: ValidationResult[];
  overallPassed: boolean;
  executionTime: number;
}

export class ValidationService {
  private results: ValidationResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.results = [];
    this.startTime = Date.now();
  }

  validateStatus(actual: number, expected: number, message?: string): ValidationResult {
    const assertion: Assertion = {
      type: 'status',
      expected,
      operator: 'equals',
      message: message || `Expected status ${expected}`
    };

    const result: ValidationResult = {
      passed: actual === expected,
      assertion,
      actual,
      error: actual !== expected ? `Status ${actual} does not match expected ${expected}` : undefined
    };

    this.results.push(result);
    return result;
  }

  validateHeader(
    headers: Record<string, string>, 
    headerName: string, 
    expected: string, 
    operator: 'equals' | 'contains' = 'equals',
    message?: string
  ): ValidationResult {
    const actual = headers[headerName.toLowerCase()] || headers[headerName];
    
    const assertion: Assertion = {
      type: 'header',
      path: headerName,
      expected,
      operator,
      message: message || `Expected header ${headerName} to ${operator} "${expected}"`
    };

    let passed = false;
    let error: string | undefined;

    if (!actual) {
      error = `Header ${headerName} not found`;
    } else if (operator === 'equals') {
      passed = actual === expected;
      if (!passed) error = `Header ${headerName} value "${actual}" does not equal "${expected}"`;
    } else if (operator === 'contains') {
      passed = actual.includes(expected);
      if (!passed) error = `Header ${headerName} value "${actual}" does not contain "${expected}"`;
    }

    const result: ValidationResult = {
      passed,
      assertion,
      actual,
      error
    };

    this.results.push(result);
    return result;
  }

  validateBody(
    body: any,
    expected: any,
    operator: 'equals' | 'contains' = 'equals',
    message?: string
  ): ValidationResult {
    const assertion: Assertion = {
      type: 'body',
      expected,
      operator,
      message: message || `Expected body to ${operator} specified value`
    };

    let passed = false;
    let error: string | undefined;
    
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedStr = typeof expected === 'string' ? expected : JSON.stringify(expected);

    if (operator === 'equals') {
      passed = bodyStr === expectedStr;
      if (!passed) error = `Body does not equal expected value`;
    } else if (operator === 'contains') {
      passed = bodyStr.includes(expectedStr);
      if (!passed) error = `Body does not contain expected value`;
    }

    const result: ValidationResult = {
      passed,
      assertion,
      actual: body,
      error
    };

    this.results.push(result);
    return result;
  }

  validateJsonPath(
    body: any,
    jsonPath: string,
    expected: any,
    operator: 'equals' | 'contains' | 'exists' = 'equals',
    message?: string
  ): ValidationResult {
    const assertion: Assertion = {
      type: 'bodyJsonPath',
      path: jsonPath,
      expected,
      operator,
      message: message || `Expected JSONPath ${jsonPath} to ${operator} "${expected}"`
    };

    let passed = false;
    let actual: any;
    let error: string | undefined;

    try {
      const results = jsonpath.query(body, jsonPath);
      
      if (operator === 'exists') {
        passed = results.length > 0;
        actual = results[0];
        if (!passed) error = `JSONPath ${jsonPath} did not match any elements`;
      } else if (results.length === 0) {
        error = `JSONPath ${jsonPath} did not match any elements`;
      } else {
        actual = results[0];
        
        if (operator === 'equals') {
          passed = JSON.stringify(actual) === JSON.stringify(expected);
          if (!passed) error = `JSONPath ${jsonPath} value does not equal expected`;
        } else if (operator === 'contains') {
          const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual);
          const expectedStr = typeof expected === 'string' ? expected : JSON.stringify(expected);
          passed = actualStr.includes(expectedStr);
          if (!passed) error = `JSONPath ${jsonPath} value does not contain expected`;
        }
      }
    } catch (e) {
      error = `JSONPath error: ${e instanceof Error ? e.message : String(e)}`;
    }

    const result: ValidationResult = {
      passed,
      assertion,
      actual,
      error
    };

    this.results.push(result);
    return result;
  }

  validateResponseTime(
    actual: number,
    maxTime: number,
    message?: string
  ): ValidationResult {
    const assertion: Assertion = {
      type: 'responseTime',
      expected: maxTime,
      operator: 'lessThan',
      message: message || `Expected response time < ${maxTime}ms`
    };

    const result: ValidationResult = {
      passed: actual < maxTime,
      assertion,
      actual,
      error: actual >= maxTime ? `Response time ${actual}ms exceeds maximum ${maxTime}ms` : undefined,
      duration: actual
    };

    this.results.push(result);
    return result;
  }

  validateContentType(
    headers: Record<string, string>,
    expected: string,
    message?: string
  ): ValidationResult {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    
    const assertion: Assertion = {
      type: 'contentType',
      expected,
      operator: 'contains',
      message: message || `Expected content-type to contain "${expected}"`
    };

    const result: ValidationResult = {
      passed: contentType.toLowerCase().includes(expected.toLowerCase()),
      assertion,
      actual: contentType,
      error: !contentType.toLowerCase().includes(expected.toLowerCase()) 
        ? `Content-Type "${contentType}" does not contain "${expected}"` 
        : undefined
    };

    this.results.push(result);
    return result;
  }

  validateContains(
    body: any,
    searchString: string,
    shouldContain: boolean = true,
    message?: string
  ): ValidationResult {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    
    const assertion: Assertion = {
      type: shouldContain ? 'contains' : 'notContains',
      expected: searchString,
      operator: 'contains',
      message: message || `Expected body to ${shouldContain ? 'contain' : 'not contain'} "${searchString}"`
    };

    const contains = bodyStr.includes(searchString);
    const passed = shouldContain ? contains : !contains;

    const result: ValidationResult = {
      passed,
      assertion,
      actual: bodyStr.substring(0, 200) + (bodyStr.length > 200 ? '...' : ''),
      error: !passed 
        ? `Body ${shouldContain ? 'does not contain' : 'contains'} "${searchString}"` 
        : undefined
    };

    this.results.push(result);
    return result;
  }

  validateMatches(
    body: any,
    pattern: string | RegExp,
    message?: string
  ): ValidationResult {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    const assertion: Assertion = {
      type: 'matches',
      expected: pattern.toString(),
      operator: 'matches',
      message: message || `Expected body to match pattern ${pattern}`
    };

    const result: ValidationResult = {
      passed: regex.test(bodyStr),
      assertion,
      actual: bodyStr.substring(0, 200) + (bodyStr.length > 200 ? '...' : ''),
      error: !regex.test(bodyStr) ? `Body does not match pattern ${pattern}` : undefined
    };

    this.results.push(result);
    return result;
  }

  // Batch validation from assertion array
  async validateAssertions(
    response: {
      status: number;
      headers: Record<string, string>;
      data: any;
      metrics?: { duration: number };
    },
    assertions: Assertion[]
  ): Promise<ValidationReport> {
    this.reset();

    for (const assertion of assertions) {
      switch (assertion.type) {
        case 'status':
          this.validateStatus(response.status, assertion.expected, assertion.message);
          break;
          
        case 'header':
          if (assertion.path) {
            this.validateHeader(
              response.headers,
              assertion.path,
              assertion.expected,
              assertion.operator as 'equals' | 'contains',
              assertion.message
            );
          }
          break;
          
        case 'body':
          this.validateBody(
            response.data,
            assertion.expected,
            assertion.operator as 'equals' | 'contains',
            assertion.message
          );
          break;
          
        case 'bodyJsonPath':
          if (assertion.path) {
            this.validateJsonPath(
              response.data,
              assertion.path,
              assertion.expected,
              assertion.operator as 'equals' | 'contains' | 'exists',
              assertion.message
            );
          }
          break;
          
        case 'responseTime':
          if (response.metrics?.duration) {
            this.validateResponseTime(
              response.metrics.duration,
              assertion.expected,
              assertion.message
            );
          }
          break;
          
        case 'contentType':
          this.validateContentType(response.headers, assertion.expected, assertion.message);
          break;
          
        case 'contains':
          this.validateContains(response.data, assertion.expected, true, assertion.message);
          break;
          
        case 'notContains':
          this.validateContains(response.data, assertion.expected, false, assertion.message);
          break;
          
        case 'matches':
          this.validateMatches(response.data, assertion.expected, assertion.message);
          break;
      }
    }

    return this.getReport();
  }

  getReport(): ValidationReport {
    const passedCount = this.results.filter(r => r.passed).length;
    const failedCount = this.results.filter(r => !r.passed).length;

    return {
      totalAssertions: this.results.length,
      passedAssertions: passedCount,
      failedAssertions: failedCount,
      results: [...this.results],
      overallPassed: failedCount === 0,
      executionTime: Date.now() - this.startTime
    };
  }

  getResults(): ValidationResult[] {
    return [...this.results];
  }
}

// Export schemas for validation
export const AssertionSchema = z.object({
  type: z.enum([
    'status', 'header', 'body', 'bodyJson', 'bodyJsonPath',
    'responseTime', 'contentType', 'contains', 'notContains', 'matches'
  ]),
  path: z.string().optional(),
  expected: z.any(),
  operator: z.enum(['equals', 'contains', 'lessThan', 'greaterThan', 'matches', 'exists']).optional(),
  message: z.string().optional()
});

export const ValidationResultSchema = z.object({
  passed: z.boolean(),
  assertion: AssertionSchema,
  actual: z.any().optional(),
  error: z.string().optional(),
  duration: z.number().optional()
});

export const ValidationReportSchema = z.object({
  totalAssertions: z.number(),
  passedAssertions: z.number(),
  failedAssertions: z.number(),
  results: z.array(ValidationResultSchema),
  overallPassed: z.boolean(),
  executionTime: z.number()
});