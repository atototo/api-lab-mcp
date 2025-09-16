import { z } from 'zod';
import { AuthConfigSchema } from './auth';
import { AssertionSchema } from '../core/services/ValidationService';

export interface BatchTestRequest {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  auth?: any; // AuthConfig
  assertions?: any[]; // Assertion[]
  delay?: number; // Delay before this request in ms
}

export interface BatchTestResult {
  name: string;
  url: string;
  method: string;
  success: boolean;
  status?: number;
  statusText?: string;
  duration?: number;
  error?: string;
  assertionResults?: {
    passed: number;
    failed: number;
    total: number;
  };
}

export interface BatchTestOptions {
  parallel?: boolean; // Run tests in parallel or sequentially
  maxConcurrent?: number; // Max concurrent requests when parallel
  stopOnFailure?: boolean; // Stop batch if a test fails
  delayBetween?: number; // Default delay between requests (ms)
  timeout?: number; // Timeout for each request
  retryOnFailure?: boolean; // Retry failed requests
  retryAttempts?: number; // Number of retry attempts
}

export interface BatchTestReport {
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  results: BatchTestResult[];
  summary: {
    successRate: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalAssertions?: number;
    passedAssertions?: number;
    failedAssertions?: number;
  };
  stopped?: boolean; // True if stopped due to stopOnFailure
}

// Zod schemas
export const BatchTestRequestSchema = z.object({
  name: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  params: z.record(z.string()).optional(),
  auth: AuthConfigSchema.optional(),
  assertions: z.array(AssertionSchema).optional(),
  delay: z.number().positive().optional()
});

export const BatchTestOptionsSchema = z.object({
  parallel: z.boolean().optional(),
  maxConcurrent: z.number().positive().max(10).optional(),
  stopOnFailure: z.boolean().optional(),
  delayBetween: z.number().min(0).optional(),
  timeout: z.number().positive().optional(),
  retryOnFailure: z.boolean().optional(),
  retryAttempts: z.number().min(0).max(3).optional()
});