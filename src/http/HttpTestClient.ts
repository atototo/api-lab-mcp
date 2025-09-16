import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { z } from 'zod';
import { AuthenticationService } from '../core/services/AuthenticationService';
import { AuthConfig } from '../types/auth';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  auth?: AuthConfig;
}

export interface RequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  retryCount?: number;
  totalDuration?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  metrics: RequestMetrics;
  config: AxiosRequestConfig;
}

export class HttpTestClient {
  private client: AxiosInstance;
  private config: HttpClientConfig;
  private metrics: Map<string, RequestMetrics> = new Map();
  private authService: AuthenticationService;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 0,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers
    });

    this.authService = new AuthenticationService();
    if (config.auth) {
      this.authService.setAuth(config.auth);
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        // Apply authentication
        const updatedConfig = await this.authService.applyAuth(config);
        
        // Add request ID to headers for tracking
        updatedConfig.headers['X-Request-Id'] = requestId;
        
        // Calculate request size
        const requestSize = this.calculateSize(updatedConfig.data);
        
        // Store initial metrics
        this.metrics.set(requestId, {
          startTime,
          endTime: 0,
          duration: 0,
          requestSize,
          responseSize: 0
        });

        return updatedConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const requestId = response.config.headers?.['X-Request-Id'] as string;
        const endTime = Date.now();
        
        if (requestId && this.metrics.has(requestId)) {
          const metrics = this.metrics.get(requestId)!;
          metrics.endTime = endTime;
          metrics.duration = endTime - metrics.startTime;
          metrics.responseSize = this.calculateSize(response.data);
          
          // Attach metrics to response
          (response as any).metrics = metrics;
        }

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config;
        if (!config) {
          return Promise.reject(error);
        }

        // Handle retries
        const retryCount = (config as any).__retryCount || 0;
        const requestId = config.headers?.['X-Request-Id'] as string;
        
        if (retryCount < this.config.retryAttempts! && this.shouldRetry(error)) {
          (config as any).__retryCount = retryCount + 1;
          
          // Update retry metrics
          if (requestId && this.metrics.has(requestId)) {
            const metrics = this.metrics.get(requestId)!;
            metrics.retryCount = retryCount + 1;
            console.error(`[HttpTestClient] Retry attempt ${retryCount + 1}/${this.config.retryAttempts} for request ${requestId}`);
          }
          
          // Wait before retrying
          await this.delay(this.config.retryDelay! * Math.pow(2, retryCount));
          
          return this.client.request(config);
        }

        // Update final metrics on failure
        if (requestId && this.metrics.has(requestId)) {
          const metrics = this.metrics.get(requestId)!;
          const endTime = Date.now();
          metrics.endTime = endTime;
          metrics.duration = endTime - metrics.startTime;
          metrics.totalDuration = endTime - metrics.startTime;
          metrics.retryCount = retryCount;
          
          // Attach metrics to error for visibility
          (error as any).metrics = metrics;
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    if (!error.response) {
      return true; // Network error
    }
    
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSize(data: any): number {
    if (!data) return 0;
    
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      return 0;
    }
  }

  private prepareResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
    const metrics = (response as any).metrics || {
      startTime: 0,
      endTime: 0,
      duration: 0,
      requestSize: 0,
      responseSize: 0
    };

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      metrics,
      config: response.config
    };
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.prepareResponse(response);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.prepareResponse(response);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.prepareResponse(response);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.prepareResponse(response);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.patch<T>(url, data, config);
    return this.prepareResponse(response);
  }

  async head<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.head<T>(url, config);
    return this.prepareResponse(response);
  }

  async options<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.options<T>(url, config);
    return this.prepareResponse(response);
  }

  // Utility methods
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
    this.config.baseURL = url;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers.common, headers);
  }

  setAuthToken(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): void {
    if (type === 'Bearer') {
      this.authService.setAuth({ type: 'bearer', token });
    } else if (type === 'Basic') {
      // For basic auth, token should be "username:password"
      const [username, password] = token.split(':');
      this.authService.setAuth({ type: 'basic', username, password });
    } else if (type === 'ApiKey') {
      this.authService.setAuth({ type: 'apikey', key: token });
    }
  }

  setAuth(config: AuthConfig): void {
    this.authService.setAuth(config);
  }

  clearAuthToken(): void {
    this.authService.clearAuth();
  }

  getAuth(): AuthConfig | null {
    return this.authService.getAuth();
  }

  getMetrics(): Map<string, RequestMetrics> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export schemas for validation
export const HttpClientConfigSchema = z.object({
  baseURL: z.string().url().optional(),
  timeout: z.number().positive().optional(),
  headers: z.record(z.string()).optional(),
  retryAttempts: z.number().min(0).max(5).optional(),
  retryDelay: z.number().positive().optional()
});

export const RequestMetricsSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  requestSize: z.number(),
  responseSize: z.number()
});