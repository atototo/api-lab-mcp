import axios, { InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { 
  AuthConfig, 
  AuthHeaders,
  BearerAuthConfig,
  BasicAuthConfig,
  ApiKeyAuthConfig,
  OAuth2Config
} from '../../types/auth';

export interface OAuth2TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export class AuthenticationService {
  private currentAuth: AuthConfig | null = null;
  private tokenCache: Map<string, OAuth2TokenResponse> = new Map();
  private tokenExpiryTimes: Map<string, number> = new Map();

  constructor() {}

  /**
   * Set the current authentication configuration
   */
  setAuth(config: AuthConfig): void {
    this.currentAuth = config;
  }

  /**
   * Clear the current authentication
   */
  clearAuth(): void {
    this.currentAuth = null;
    this.tokenCache.clear();
    this.tokenExpiryTimes.clear();
  }

  /**
   * Get the current authentication configuration
   */
  getAuth(): AuthConfig | null {
    return this.currentAuth;
  }

  /**
   * Apply authentication to request config
   */
  async applyAuth(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    if (!this.currentAuth) {
      return config;
    }

    const headers = await this.getAuthHeaders(this.currentAuth);
    
    config.headers = {
      ...config.headers,
      ...headers
    } as any;

    return config;
  }

  /**
   * Get authentication headers for the current auth config
   */
  async getAuthHeaders(authConfig?: AuthConfig): Promise<AuthHeaders> {
    const auth = authConfig || this.currentAuth;
    
    if (!auth) {
      return {};
    }

    switch (auth.type) {
      case 'bearer':
        return this.getBearerHeaders(auth);
      
      case 'basic':
        return this.getBasicHeaders(auth);
      
      case 'apikey':
        return this.getApiKeyHeaders(auth);
      
      case 'oauth2':
        return await this.getOAuth2Headers(auth);
      
      default:
        throw new Error(`Unsupported auth type: ${(auth as any).type}`);
    }
  }

  /**
   * Get Bearer token headers
   */
  private getBearerHeaders(config: BearerAuthConfig): AuthHeaders {
    const prefix = config.prefix || 'Bearer';
    return {
      'Authorization': `${prefix} ${config.token}`
    };
  }

  /**
   * Get Basic auth headers
   */
  private getBasicHeaders(config: BasicAuthConfig): AuthHeaders {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`
    };
  }

  /**
   * Get API Key headers
   */
  private getApiKeyHeaders(config: ApiKeyAuthConfig): AuthHeaders {
    const header = config.header || 'X-API-Key';
    const value = config.prefix ? `${config.prefix} ${config.key}` : config.key;
    
    return {
      [header]: value
    };
  }

  /**
   * Get OAuth2 headers, fetching token if needed
   */
  private async getOAuth2Headers(config: OAuth2Config): Promise<AuthHeaders> {
    let accessToken = config.accessToken;

    // If no access token, try to get one
    if (!accessToken) {
      if (config.grantType === 'client_credentials' && config.tokenUrl) {
        const tokenResponse = await this.fetchOAuth2Token(config);
        accessToken = tokenResponse.access_token;
      } else if (config.grantType === 'refresh_token' && config.refreshToken && config.tokenUrl) {
        const tokenResponse = await this.refreshOAuth2Token(config);
        accessToken = tokenResponse.access_token;
      } else {
        throw new Error('OAuth2: No access token available and cannot fetch one');
      }
    }

    return {
      'Authorization': `Bearer ${accessToken}`
    };
  }

  /**
   * Fetch OAuth2 token using client credentials
   */
  private async fetchOAuth2Token(config: OAuth2Config): Promise<OAuth2TokenResponse> {
    const cacheKey = `${config.clientId}:${config.tokenUrl}`;
    
    // Check cache
    if (this.tokenCache.has(cacheKey)) {
      const expiry = this.tokenExpiryTimes.get(cacheKey);
      if (expiry && Date.now() < expiry) {
        return this.tokenCache.get(cacheKey)!;
      }
    }

    if (!config.tokenUrl) {
      throw new Error('OAuth2: Token URL is required for client credentials flow');
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      ...(config.clientSecret && { client_secret: config.clientSecret }),
      ...(config.scope && { scope: config.scope })
    });

    try {
      const response = await axios.post<OAuth2TokenResponse>(
        config.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenResponse = response.data;
      
      // Cache the token
      this.tokenCache.set(cacheKey, tokenResponse);
      
      // Set expiry time (default to 1 hour if not specified)
      const expiresIn = tokenResponse.expires_in || 3600;
      this.tokenExpiryTimes.set(cacheKey, Date.now() + (expiresIn * 1000));

      return tokenResponse;
    } catch (error) {
      throw new Error(`OAuth2: Failed to fetch token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh OAuth2 token
   */
  private async refreshOAuth2Token(config: OAuth2Config): Promise<OAuth2TokenResponse> {
    if (!config.tokenUrl) {
      throw new Error('OAuth2: Token URL is required for refresh token flow');
    }

    if (!config.refreshToken) {
      throw new Error('OAuth2: Refresh token is required for refresh flow');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      ...(config.clientSecret && { client_secret: config.clientSecret }),
      ...(config.scope && { scope: config.scope })
    });

    try {
      const response = await axios.post<OAuth2TokenResponse>(
        config.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`OAuth2: Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate an auth configuration
   */
  validateAuthConfig(config: any): AuthConfig {
    const result = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('bearer'),
        token: z.string().min(1),
        prefix: z.string().optional()
      }),
      z.object({
        type: z.literal('basic'),
        username: z.string().min(1),
        password: z.string().min(1)
      }),
      z.object({
        type: z.literal('apikey'),
        key: z.string().min(1),
        header: z.string().optional(),
        prefix: z.string().optional()
      }),
      z.object({
        type: z.literal('oauth2'),
        clientId: z.string().min(1),
        clientSecret: z.string().optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenUrl: z.string().url().optional(),
        authorizationUrl: z.string().url().optional(),
        scope: z.string().optional(),
        grantType: z.enum(['client_credentials', 'authorization_code', 'refresh_token']).optional()
      })
    ]).parse(config);

    return result as AuthConfig;
  }

  /**
   * Clone the service with current state
   */
  clone(): AuthenticationService {
    const newService = new AuthenticationService();
    if (this.currentAuth) {
      newService.setAuth({ ...this.currentAuth });
    }
    // Copy token cache
    this.tokenCache.forEach((value, key) => {
      newService.tokenCache.set(key, { ...value });
    });
    this.tokenExpiryTimes.forEach((value, key) => {
      newService.tokenExpiryTimes.set(key, value);
    });
    return newService;
  }
}