import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidationService, Assertion } from '../../../src/core/services/ValidationService';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validateStatus', () => {
    it('should pass when status matches', () => {
      const result = service.validateStatus(200, 200);
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe(200);
      expect(result.assertion.expected).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('should fail when status does not match', () => {
      const result = service.validateStatus(404, 200);
      
      expect(result.passed).toBe(false);
      expect(result.actual).toBe(404);
      expect(result.assertion.expected).toBe(200);
      expect(result.error).toContain('Status 404 does not match expected 200');
    });

    it('should use custom message', () => {
      const result = service.validateStatus(200, 200, 'Custom status message');
      
      expect(result.assertion.message).toBe('Custom status message');
    });
  });

  describe('validateHeader', () => {
    const headers = {
      'content-type': 'application/json',
      'x-api-version': '1.0',
      'authorization': 'Bearer token123',
    };

    it('should pass when header equals expected value', () => {
      const result = service.validateHeader(headers, 'content-type', 'application/json', 'equals');
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('application/json');
    });

    it('should pass when header contains expected value', () => {
      const result = service.validateHeader(headers, 'content-type', 'json', 'contains');
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('application/json');
    });

    it('should fail when header does not exist', () => {
      const result = service.validateHeader(headers, 'non-existent', 'value', 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Header non-existent not found');
    });

    it('should fail when header does not match', () => {
      const result = service.validateHeader(headers, 'x-api-version', '2.0', 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('does not equal');
    });

    it('should handle case-insensitive header names', () => {
      const result = service.validateHeader(headers, 'Content-Type', 'application/json', 'equals');
      
      expect(result.passed).toBe(true);
    });
  });

  describe('validateBody', () => {
    it('should pass when body equals expected string', () => {
      const result = service.validateBody('Hello World', 'Hello World', 'equals');
      
      expect(result.passed).toBe(true);
    });

    it('should pass when body contains expected string', () => {
      const result = service.validateBody('Hello World', 'World', 'contains');
      
      expect(result.passed).toBe(true);
    });

    it('should pass when JSON body equals expected object', () => {
      const body = { name: 'test', value: 123 };
      const expected = { name: 'test', value: 123 };
      
      const result = service.validateBody(body, expected, 'equals');
      
      expect(result.passed).toBe(true);
    });

    it('should fail when body does not match', () => {
      const result = service.validateBody('Hello', 'World', 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Body does not equal expected value');
    });
  });

  describe('validateJsonPath', () => {
    const jsonBody = {
      user: {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    };

    it('should pass when JSONPath value equals expected', () => {
      const result = service.validateJsonPath(jsonBody, '$.user.name', 'John Doe', 'equals');
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('John Doe');
    });

    it('should pass when JSONPath value exists', () => {
      const result = service.validateJsonPath(jsonBody, '$.user.email', null, 'exists');
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('john@example.com');
    });

    it('should pass when JSONPath array element matches', () => {
      const result = service.validateJsonPath(jsonBody, '$.items[0].name', 'Item 1', 'equals');
      
      expect(result.passed).toBe(true);
    });

    it('should fail when JSONPath does not match any elements', () => {
      const result = service.validateJsonPath(jsonBody, '$.nonexistent', 'value', 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('did not match any elements');
    });

    it('should fail when JSONPath value does not equal expected', () => {
      const result = service.validateJsonPath(jsonBody, '$.user.age', 25, 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.actual).toBe(30);
    });

    it('should handle invalid JSONPath expressions', () => {
      const result = service.validateJsonPath(jsonBody, 'invalid path', 'value', 'equals');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('JSONPath error');
    });
  });

  describe('validateResponseTime', () => {
    it('should pass when response time is less than maximum', () => {
      const result = service.validateResponseTime(100, 200);
      
      expect(result.passed).toBe(true);
      expect(result.actual).toBe(100);
      expect(result.duration).toBe(100);
    });

    it('should fail when response time exceeds maximum', () => {
      const result = service.validateResponseTime(300, 200);
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Response time 300ms exceeds maximum 200ms');
    });
  });

  describe('validateContentType', () => {
    const headers = {
      'content-type': 'application/json; charset=utf-8',
    };

    it('should pass when content-type contains expected value', () => {
      const result = service.validateContentType(headers, 'application/json');
      
      expect(result.passed).toBe(true);
    });

    it('should fail when content-type does not contain expected value', () => {
      const result = service.validateContentType(headers, 'text/html');
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('does not contain');
    });

    it('should handle case-insensitive matching', () => {
      const result = service.validateContentType(headers, 'APPLICATION/JSON');
      
      expect(result.passed).toBe(true);
    });

    it('should handle missing content-type header', () => {
      const result = service.validateContentType({}, 'application/json');
      
      expect(result.passed).toBe(false);
    });
  });

  describe('validateContains', () => {
    const body = 'The quick brown fox jumps over the lazy dog';

    it('should pass when body contains search string', () => {
      const result = service.validateContains(body, 'quick brown', true);
      
      expect(result.passed).toBe(true);
    });

    it('should fail when body does not contain search string', () => {
      const result = service.validateContains(body, 'slow turtle', true);
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Body does not contain');
    });

    it('should pass when body does not contain string (notContains)', () => {
      const result = service.validateContains(body, 'slow turtle', false);
      
      expect(result.passed).toBe(true);
    });

    it('should fail when body contains string (notContains)', () => {
      const result = service.validateContains(body, 'quick', false);
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Body contains');
    });

    it('should handle JSON body', () => {
      const jsonBody = { message: 'test' };
      const result = service.validateContains(jsonBody, '"message":"test"', true);
      
      expect(result.passed).toBe(true);
    });
  });

  describe('validateMatches', () => {
    const body = 'Order ID: 12345, Status: completed';

    it('should pass when body matches regex pattern', () => {
      const result = service.validateMatches(body, /Order ID: \d+/);
      
      expect(result.passed).toBe(true);
    });

    it('should pass when body matches string pattern', () => {
      const result = service.validateMatches(body, 'Status: \\w+');
      
      expect(result.passed).toBe(true);
    });

    it('should fail when body does not match pattern', () => {
      const result = service.validateMatches(body, /Invoice ID: \d+/);
      
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Body does not match pattern');
    });
  });

  describe('validateAssertions', () => {
    it('should validate multiple assertions', async () => {
      const response = {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-api-version': '1.0',
        },
        data: {
          success: true,
          message: 'Operation completed',
          user: {
            id: 123,
            name: 'Test User',
          },
        },
        metrics: {
          duration: 150,
        },
      };

      const assertions: Assertion[] = [
        { type: 'status', expected: 200 },
        { type: 'header', path: 'content-type', expected: 'json', operator: 'contains' },
        { type: 'bodyJsonPath', path: '$.success', expected: true, operator: 'equals' },
        { type: 'bodyJsonPath', path: '$.user.name', expected: 'Test User', operator: 'equals' },
        { type: 'responseTime', expected: 200 },
        { type: 'contains', expected: 'completed' },
      ];

      const report = await service.validateAssertions(response, assertions);

      expect(report.totalAssertions).toBe(6);
      expect(report.passedAssertions).toBe(6);
      expect(report.failedAssertions).toBe(0);
      expect(report.overallPassed).toBe(true);
    });

    it('should handle mixed pass/fail assertions', async () => {
      const response = {
        status: 404,
        headers: {
          'content-type': 'text/html',
        },
        data: 'Not Found',
        metrics: {
          duration: 50,
        },
      };

      const assertions: Assertion[] = [
        { type: 'status', expected: 200 }, // Will fail
        { type: 'contentType', expected: 'application/json' }, // Will fail
        { type: 'responseTime', expected: 100 }, // Will pass
      ];

      const report = await service.validateAssertions(response, assertions);

      expect(report.totalAssertions).toBe(3);
      expect(report.passedAssertions).toBe(1);
      expect(report.failedAssertions).toBe(2);
      expect(report.overallPassed).toBe(false);
    });
  });

  describe('getReport', () => {
    it('should generate comprehensive report', () => {
      service.validateStatus(200, 200);
      service.validateResponseTime(100, 200);
      service.validateStatus(404, 200); // This will fail

      const report = service.getReport();

      expect(report.totalAssertions).toBe(3);
      expect(report.passedAssertions).toBe(2);
      expect(report.failedAssertions).toBe(1);
      expect(report.overallPassed).toBe(false);
      expect(report.results).toHaveLength(3);
      expect(report.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should report all passed when no failures', () => {
      service.validateStatus(200, 200);
      service.validateResponseTime(50, 100);

      const report = service.getReport();

      expect(report.overallPassed).toBe(true);
      expect(report.failedAssertions).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all results', () => {
      service.validateStatus(200, 200);
      service.validateStatus(404, 200);

      service.reset();
      const report = service.getReport();

      expect(report.totalAssertions).toBe(0);
      expect(report.results).toHaveLength(0);
    });
  });
});