import { z } from 'zod';
import { AuthConfigSchema } from './auth';

export type Environment = 'development' | 'staging' | 'production' | 'test' | string;

export interface EnvironmentConfig {
  name: string;
  baseURL?: string;
  headers?: Record<string, string>;
  auth?: any; // Will be validated by AuthConfigSchema
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  variables?: Record<string, string>;
}

export interface ConfigFile {
  version?: string;
  environments: Record<string, EnvironmentConfig>;
  defaults?: Partial<EnvironmentConfig>;
  variables?: Record<string, string>;
}

// Zod schemas for validation
export const EnvironmentConfigSchema = z.object({
  name: z.string(),
  baseURL: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
  auth: AuthConfigSchema.optional(),
  timeout: z.number().positive().optional(),
  retryAttempts: z.number().min(0).max(5).optional(),
  retryDelay: z.number().positive().optional(),
  variables: z.record(z.string()).optional()
});

export const ConfigFileSchema = z.object({
  version: z.string().optional(),
  environments: z.record(EnvironmentConfigSchema),
  defaults: EnvironmentConfigSchema.partial().optional(),
  variables: z.record(z.string()).optional()
});

export interface LoadedConfig {
  environment: string;
  config: EnvironmentConfig;
  resolvedConfig: EnvironmentConfig;
}