import { z } from 'zod';
import { HttpTestRequest } from '../../types';
import { SessionAuthConfigSchema } from '../../types/auth';

export const testWithSessionTool = {
  name: 'test_with_session',
  description: 'Test HTTP endpoint with session-based authentication (cookies and optional headers)',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'API endpoint URL'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        description: 'HTTP method (default: GET)'
      },
      body: {
        type: ['object', 'string', 'null'],
        description: 'Request body (for POST/PUT/PATCH)',
        additionalProperties: true
      },
      headers: {
        type: 'object',
        description: 'Additional request headers',
        additionalProperties: {
          type: 'string'
        }
      },
      cookies: {
        type: 'string',
        description: 'Session cookies (e.g., "JSESSIONID=ABC123; XSRF-TOKEN=xyz")'
      },
      sessionHeaders: {
        type: 'object',
        description: 'Session-specific headers like X-XSRF-TOKEN',
        additionalProperties: {
          type: 'string'
        }
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds (default: 30000)'
      }
    },
    required: ['url', 'cookies']
  }
};

export async function handleTestWithSession(
  args: any,
  context: { apiTestingService: any; httpClient: any }
): Promise<any> {
  try {
    const { 
      url, 
      method = 'GET', 
      body, 
      headers = {}, 
      cookies,
      sessionHeaders = {},
      timeout = 30000 
    } = args;
    
    // Set session authentication
    const sessionAuth = {
      type: 'session' as const,
      cookies,
      headers: sessionHeaders
    };
    
    // Validate session auth config
    SessionAuthConfigSchema.parse(sessionAuth);
    
    // Set auth in HTTP client (for consistency)
    context.httpClient.setAuth(sessionAuth);
    
    // Merge Cookie header with other headers
    const mergedHeaders = {
      ...headers,
      ...sessionHeaders,
      'Cookie': cookies  // Add Cookie header directly
    };
    
    // Prepare the test request
    const request: HttpTestRequest = {
      url,
      method,
      headers: mergedHeaders,  // Use merged headers with Cookie
      body,
      timeout
    };
    
    // Execute the test
    const result = await context.apiTestingService.executeTest(request);
    
    // Add session info to response
    const cookiePairs = cookies.split(';').map((c: string) => c.trim());
    const cookieNames = cookiePairs
      .map((pair: string) => pair.split('=')[0])
      .filter((name: string) => name);
    
    return {
      ...result,
      authentication: {
        type: 'session',
        cookies: cookieNames,
        sessionHeaders: Object.keys(sessionHeaders)
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Test failed';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return {
      success: false,
      error: errorMessage,
      stack: errorStack,
      request: {
        url: args.url,
        method: args.method || 'GET',
        headers: args.headers
      }
    };
  }
}