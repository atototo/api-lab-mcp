/**
 * Common type definitions for API Forge
 */

// HTTP Request types
export interface HttpTestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  auth?: AuthConfig;
}

// Authentication configuration
export interface AuthConfig {
  type: 'bearer' | 'apikey' | 'basic' | 'oauth2';
  token?: string;
  key?: string;
  keyName?: string;
  username?: string;
  password?: string;
}

// HTTP Response types
export interface HttpTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  size: number;
}

// Test result types
export interface TestResult {
  success: boolean;
  request: HttpTestRequest;
  response?: HttpTestResponse;
  error?: ErrorDetails;
  timestamp: string;
  duration: number;
}

// Error types
export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Validation types
export interface Assertion {
  type: 'status' | 'header' | 'body' | 'responseTime' | 'jsonPath';
  operator: 'equals' | 'contains' | 'lessThan' | 'greaterThan' | 'matches';
  expected: any;
  path?: string; // For JSONPath or header name
}

export interface ValidationResult {
  passed: boolean;
  assertions: AssertionResult[];
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  actualValue?: any;
  expectedValue: any;
  error?: string;
}