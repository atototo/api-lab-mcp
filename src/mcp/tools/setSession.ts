import { z } from 'zod';
import { SessionAuthConfigSchema } from '../../types/auth';

export const setSessionTool = {
  name: 'set_session',
  description: 'Set session-based authentication using cookies and optional headers (e.g., CSRF tokens)',
  inputSchema: {
    type: 'object',
    properties: {
      cookies: {
        type: 'string',
        description: 'Cookie string (e.g., "JSESSIONID=ABC123; XSRF-TOKEN=xyz")'
      },
      headers: {
        type: 'object',
        description: 'Additional headers like X-XSRF-TOKEN for CSRF protection',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['cookies']
  }
};

export async function handleSetSession(
  args: any,
  context: { httpClient: any }
): Promise<any> {
  try {
    const { cookies, headers } = args;
    
    // Create session auth config
    const sessionAuth = {
      type: 'session' as const,
      cookies,
      headers: headers || {}
    };
    
    // Validate using schema
    SessionAuthConfigSchema.parse(sessionAuth);
    
    // Set authentication in the HTTP client
    context.httpClient.setAuth(sessionAuth);
    
    // Parse cookies to show what was configured
    const cookiePairs = cookies.split(';').map((c: string) => c.trim());
    const cookieNames = cookiePairs
      .map((pair: string) => pair.split('=')[0])
      .filter((name: string) => name);
    
    // Build response message
    let message = `Session authentication configured with cookies: ${cookieNames.join(', ')}`;
    
    if (headers && Object.keys(headers).length > 0) {
      const headerNames = Object.keys(headers);
      message += `\nAdditional headers: ${headerNames.join(', ')}`;
    }
    
    return {
      success: true,
      message,
      authType: 'session',
      configured: {
        cookies: cookieNames,
        headers: headers ? Object.keys(headers) : []
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure session authentication',
      configured: false
    };
  }
}