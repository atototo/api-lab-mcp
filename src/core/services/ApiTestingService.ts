import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { 
  HttpTestRequest, 
  HttpTestResponse, 
  TestResult, 
  ErrorDetails 
} from '@/types';

export class ApiTestingService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds default timeout
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add timing
    this.axiosInstance.interceptors.request.use((config: any) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });

    // Response interceptor to calculate response time
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        const endTime = Date.now();
        const startTime = response.config?.metadata?.startTime || endTime;
        response.responseTime = endTime - startTime;
        return response;
      },
      (error: any) => {
        const endTime = Date.now();
        const startTime = error.config?.metadata?.startTime || endTime;
        if (error.response) {
          error.response.responseTime = endTime - startTime;
        }
        return Promise.reject(error);
      }
    );
  }

  async executeTest(request: HttpTestRequest): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(request);
      const endTime = Date.now();

      return {
        success: true,
        request,
        response: this.formatResponse(response),
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        success: false,
        request,
        error: this.formatError(error),
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
      };
    }
  }

  private async makeRequest(request: HttpTestRequest): Promise<AxiosResponse> {
    const config: any = {
      method: request.method,
      url: request.url,
      headers: request.headers || {},
      timeout: request.timeout || 30000,
    };

    // Add request body if present
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      config.data = request.body;
      
      // Set content-type if not provided
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        if (typeof request.body === 'object') {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }

    // Handle authentication
    if (request.auth) {
      this.applyAuth(config, request.auth);
    }

    return await this.axiosInstance.request(config);
  }

  private applyAuth(config: any, auth: any): void {
    switch (auth.type) {
      case 'bearer':
        config.headers['Authorization'] = `Bearer ${auth.token}`;
        break;
      case 'apikey':
        config.headers[auth.keyName || 'X-API-Key'] = auth.key;
        break;
      case 'basic':
        config.auth = {
          username: auth.username,
          password: auth.password,
        };
        break;
      // OAuth2 can be added later
    }
  }

  private formatResponse(response: any): HttpTestResponse {
    const responseSize = this.calculateResponseSize(response);
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      body: response.data,
      responseTime: response.responseTime || 0,
      size: responseSize,
    };
  }

  private calculateResponseSize(response: AxiosResponse): number {
    try {
      const bodyStr = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      return new TextEncoder().encode(bodyStr).length;
    } catch {
      return 0;
    }
  }

  private formatError(error: any): ErrorDetails {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error status
        return {
          code: 'HTTP_ERROR',
          message: `Request failed with status ${error.response.status}`,
          details: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          },
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          code: 'NO_RESPONSE',
          message: 'No response received from server',
          details: {
            timeout: error.code === 'ECONNABORTED',
            code: error.code,
          },
        };
      } else {
        // Error setting up the request
        return {
          code: 'REQUEST_SETUP_ERROR',
          message: error.message,
        };
      }
    }

    // Unknown error type
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
    };
  }
}