import { z } from 'zod';
import { AuthConfigSchema } from '../../types/auth';
import { AssertionSchema } from '../../core/services/ValidationService';
import { formatTestResult } from '../../core/utils/formatters';
import { authSchema, assertionSchema } from './schemaHelpers';

export const testWithAuthTool = {
  name: 'test_with_auth',
  description: 'Test an HTTP endpoint with authentication and optional assertions',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to test'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        default: 'GET',
        description: 'HTTP method'
      },
      auth: authSchema,
      headers: {
        type: 'object',
        description: 'Additional headers',
        additionalProperties: { type: 'string' }
      },
      body: {
        description: 'Request body (for POST, PUT, PATCH)'
      },
      params: {
        type: 'object',
        description: 'Query parameters',
        additionalProperties: { type: 'string' }
      },
      assertions: {
        type: 'array',
        description: 'Assertions to validate response',
        items: assertionSchema
      }
    },
    required: ['url', 'auth']
  }
};

export async function handleTestWithAuth(
  args: any,
  context: { httpClient: any; validationService: any }
): Promise<any> {
  try {
    const { url, method = 'GET', auth, headers, body, params, assertions } = args;
    
    // Store current auth config (if any) to restore later
    const previousAuth = context.httpClient.getAuth();
    
    try {
      // Set the auth config for this request
      context.httpClient.setAuth(auth);
      
      // Prepare request config
      const config: any = {
        headers: headers || {},
        params: params || {}
      };
      
      // Execute the request based on method
      let response;
      const lowerMethod = method.toLowerCase();
      
      switch (lowerMethod) {
        case 'get':
          response = await context.httpClient.get(url, config);
          break;
        case 'post':
          response = await context.httpClient.post(url, body, config);
          break;
        case 'put':
          response = await context.httpClient.put(url, body, config);
          break;
        case 'delete':
          response = await context.httpClient.delete(url, config);
          break;
        case 'patch':
          response = await context.httpClient.patch(url, body, config);
          break;
        case 'head':
          response = await context.httpClient.head(url, config);
          break;
        case 'options':
          response = await context.httpClient.options(url, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      // Run assertions if provided
      let validationReport = null;
      if (assertions && assertions.length > 0) {
        validationReport = await context.validationService.validateAssertions(response, assertions);
      }
      
      // Format the result
      const result = formatTestResult({
        url,
        method,
        response,
        validationReport,
        error: null
      });
      
      // Add auth info to result
      result.authentication = {
        type: auth.type,
        configured: true,
        ...(auth.type === 'basic' && { username: auth.username }),
        ...(auth.type === 'oauth2' && { clientId: auth.clientId })
      };
      
      return result;
      
    } finally {
      // Restore previous auth config
      if (previousAuth) {
        context.httpClient.setAuth(previousAuth);
      } else {
        context.httpClient.clearAuthToken();
      }
    }
    
  } catch (error: any) {
    // Handle errors
    const isAxiosError = error.response !== undefined;
    
    if (isAxiosError) {
      // HTTP error response
      return formatTestResult({
        url: args.url,
        method: args.method || 'GET',
        response: {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          metrics: error.metrics || { duration: 0 }
        },
        validationReport: null,
        error: error.message
      });
    } else {
      // Network or other error
      return {
        success: false,
        url: args.url,
        method: args.method || 'GET',
        error: error.message || 'Request failed',
        authentication: {
          type: args.auth?.type,
          configured: true
        }
      };
    }
  }
}