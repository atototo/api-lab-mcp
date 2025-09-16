import { z } from 'zod';

export type AuthType = 'bearer' | 'basic' | 'apikey' | 'oauth2';

export interface BearerAuthConfig {
  type: 'bearer';
  token: string;
  prefix?: string; // Default: 'Bearer'
}

export interface BasicAuthConfig {
  type: 'basic';
  username: string;
  password: string;
}

export interface ApiKeyAuthConfig {
  type: 'apikey';
  key: string;
  header?: string; // Default: 'X-API-Key'
  prefix?: string; // Optional prefix for the key
}

export interface OAuth2Config {
  type: 'oauth2';
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenUrl?: string;
  authorizationUrl?: string;
  scope?: string;
  grantType?: 'client_credentials' | 'authorization_code' | 'refresh_token';
}

export type AuthConfig = 
  | BearerAuthConfig 
  | BasicAuthConfig 
  | ApiKeyAuthConfig 
  | OAuth2Config;

// Zod schemas for validation
export const BearerAuthConfigSchema = z.object({
  type: z.literal('bearer'),
  token: z.string().min(1),
  prefix: z.string().optional()
});

export const BasicAuthConfigSchema = z.object({
  type: z.literal('basic'),
  username: z.string().min(1),
  password: z.string().min(1)
});

export const ApiKeyAuthConfigSchema = z.object({
  type: z.literal('apikey'),
  key: z.string().min(1),
  header: z.string().optional(),
  prefix: z.string().optional()
});

export const OAuth2ConfigSchema = z.object({
  type: z.literal('oauth2'),
  clientId: z.string().min(1),
  clientSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenUrl: z.string().url().optional(),
  authorizationUrl: z.string().url().optional(),
  scope: z.string().optional(),
  grantType: z.enum(['client_credentials', 'authorization_code', 'refresh_token']).optional()
});

export const AuthConfigSchema = z.discriminatedUnion('type', [
  BearerAuthConfigSchema,
  BasicAuthConfigSchema,
  ApiKeyAuthConfigSchema,
  OAuth2ConfigSchema
]);

// Helper type for auth headers
export interface AuthHeaders {
  [key: string]: string;
}