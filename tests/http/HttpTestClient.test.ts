import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { HttpTestClient } from '../../src/http/HttpTestClient';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpTestClient', () => {
  let client: HttpTestClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((successHandler) => {
            // Store the interceptor for testing
            (mockInstance as any).requestInterceptor = successHandler;
            return 0;
          }),
        },
        response: {
          use: jest.fn((successHandler, errorHandler) => {
            // Store the interceptors for testing
            (mockInstance as any).responseInterceptor = successHandler;
            (mockInstance as any).responseErrorInterceptor = errorHandler;
            return 0;
          }),
        },
      },
      defaults: {
        baseURL: undefined,
        headers: {
          common: {},
        },
      },
    };

    (mockedAxios.create as jest.Mock).mockReturnValue(mockInstance as any);
    client = new HttpTestClient();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const client = new HttpTestClient();
      expect(client).toBeDefined();
    });

    it('should create instance with custom config', () => {
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: { 'X-Custom': 'header' },
        retryAttempts: 3,
        retryDelay: 2000,
      };
      
      const client = new HttpTestClient(config);
      expect(client).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: config.baseURL,
          timeout: config.timeout,
          headers: config.headers,
        })
      );
    });
  });

  describe('HTTP methods', () => {
    let mockResponse: any;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockResponse = {
        data: { test: 'data' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {},
        metrics: {
          startTime: Date.now(),
          endTime: Date.now() + 100,
          duration: 100,
          requestSize: 50,
          responseSize: 100,
        },
      };

      mockAxiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
    });

    it('should make GET request', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await client.get('https://api.example.com/test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://api.example.com/test',
        undefined
      );
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ test: 'data' });
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await client.post('https://api.example.com/test', data);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.example.com/test',
        data,
        undefined
      );
      expect(result.status).toBe(200);
    });

    it('should make PUT request', async () => {
      const data = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);
      
      const result = await client.put('https://api.example.com/test', data);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        'https://api.example.com/test',
        data,
        undefined
      );
      expect(result.status).toBe(200);
    });

    it('should make DELETE request', async () => {
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);
      
      const result = await client.delete('https://api.example.com/test');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        'https://api.example.com/test',
        undefined
      );
      expect(result.status).toBe(200);
    });

    it('should make PATCH request', async () => {
      const data = { field: 'value' };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);
      
      const result = await client.patch('https://api.example.com/test', data);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        data,
        undefined
      );
      expect(result.status).toBe(200);
    });

    it('should make HEAD request', async () => {
      mockAxiosInstance.head.mockResolvedValue(mockResponse);
      
      const result = await client.head('https://api.example.com/test');
      
      expect(mockAxiosInstance.head).toHaveBeenCalledWith(
        'https://api.example.com/test',
        undefined
      );
      expect(result.status).toBe(200);
    });

    it('should make OPTIONS request', async () => {
      mockAxiosInstance.options.mockResolvedValue(mockResponse);
      
      const result = await client.options('https://api.example.com/test');
      
      expect(mockAxiosInstance.options).toHaveBeenCalledWith(
        'https://api.example.com/test',
        undefined
      );
      expect(result.status).toBe(200);
    });
  });

  describe('utility methods', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
    });

    it('should set base URL', () => {
      client.setBaseURL('https://new-api.example.com');
      
      expect(mockAxiosInstance.defaults.baseURL).toBe('https://new-api.example.com');
    });

    it('should set default headers', () => {
      const headers = { 'X-Custom': 'value', 'X-Another': 'header' };
      client.setDefaultHeaders(headers);
      
      expect(mockAxiosInstance.defaults.headers.common).toEqual(
        expect.objectContaining(headers)
      );
    });

    it('should set Bearer auth token', () => {
      client.setAuthToken('my-token', 'Bearer');
      
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer my-token');
    });

    it('should set Basic auth token', () => {
      client.setAuthToken('base64-credentials', 'Basic');
      
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Basic base64-credentials');
    });

    it('should set API key', () => {
      client.setAuthToken('api-key-value', 'ApiKey');
      
      expect(mockAxiosInstance.defaults.headers.common['X-API-Key']).toBe('api-key-value');
    });

    it('should clear auth token', () => {
      mockAxiosInstance.defaults.headers.common['Authorization'] = 'Bearer token';
      mockAxiosInstance.defaults.headers.common['X-API-Key'] = 'key';
      
      client.clearAuthToken();
      
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
      expect(mockAxiosInstance.defaults.headers.common['X-API-Key']).toBeUndefined();
    });

    it('should get metrics', () => {
      const metrics = client.getMetrics();
      
      expect(metrics).toBeInstanceOf(Map);
      expect(metrics.size).toBe(0);
    });

    it('should clear metrics', () => {
      const metrics = client.getMetrics();
      client.clearMetrics();
      
      expect(metrics.size).toBe(0);
    });
  });

  describe('retry logic', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      jest.useFakeTimers();
      
      const config = {
        retryAttempts: 2,
        retryDelay: 1000,
      };
      client = new HttpTestClient(config);
      mockAxiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on network error', async () => {
      const error = new Error('Network error');
      (error as any).config = { __retryCount: 0 };
      (error as any).response = undefined;

      mockAxiosInstance.request = jest.fn() as any;
      mockAxiosInstance.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        });

      const responseErrorInterceptor = mockAxiosInstance.responseErrorInterceptor;
      
      const promise = responseErrorInterceptor(error);
      
      // Fast-forward through the delay
      jest.advanceTimersByTime(1000);
      
      await promise;
      
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx error', async () => {
      const error = new Error('Server error');
      (error as any).config = { __retryCount: 0 };
      (error as any).response = { status: 500 };

      mockAxiosInstance.request = jest.fn() as any;
      mockAxiosInstance.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        });

      const responseErrorInterceptor = mockAxiosInstance.responseErrorInterceptor;
      
      const promise = responseErrorInterceptor(error);
      
      // Fast-forward through the delay
      jest.advanceTimersByTime(1000);
      
      await promise;
      
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 4xx error', async () => {
      const error = new Error('Client error');
      (error as any).config = { __retryCount: 0 };
      (error as any).response = { status: 404 };

      mockAxiosInstance.request = jest.fn() as any;

      const responseErrorInterceptor = mockAxiosInstance.responseErrorInterceptor;
      
      await expect(responseErrorInterceptor(error)).rejects.toThrow('Client error');
      
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should not retry beyond max attempts', async () => {
      const error = new Error('Network error');
      (error as any).config = { __retryCount: 2 }; // Already at max
      (error as any).response = undefined;

      mockAxiosInstance.request = jest.fn() as any;

      const responseErrorInterceptor = mockAxiosInstance.responseErrorInterceptor;
      
      await expect(responseErrorInterceptor(error)).rejects.toThrow('Network error');
      
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });
  });
});