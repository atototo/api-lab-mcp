import { z } from 'zod';
import { AuthConfigSchema } from '../../types/auth';

export const setAuthConfigTool = {
  name: 'set_auth_config',
  description: 'Configure authentication for API testing (Bearer, Basic, API Key, or OAuth2)',
  inputSchema: {
    type: 'object',
    properties: {
      auth: {
        type: 'object',
        description: 'Authentication configuration',
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'bearer' },
              token: { type: 'string', description: 'Bearer token' },
              prefix: { type: 'string', description: 'Token prefix (default: Bearer)' }
            },
            required: ['type', 'token']
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'basic' },
              username: { type: 'string', description: 'Username' },
              password: { type: 'string', description: 'Password' }
            },
            required: ['type', 'username', 'password']
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'apikey' },
              key: { type: 'string', description: 'API key' },
              header: { type: 'string', description: 'Header name (default: X-API-Key)' },
              prefix: { type: 'string', description: 'Key prefix' }
            },
            required: ['type', 'key']
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'oauth2' },
              clientId: { type: 'string', description: 'OAuth2 client ID' },
              clientSecret: { type: 'string', description: 'OAuth2 client secret' },
              accessToken: { type: 'string', description: 'Access token' },
              refreshToken: { type: 'string', description: 'Refresh token' },
              tokenUrl: { type: 'string', description: 'Token endpoint URL' },
              grantType: { 
                type: 'string', 
                enum: ['client_credentials', 'authorization_code', 'refresh_token'],
                description: 'OAuth2 grant type'
              }
            },
            required: ['type', 'clientId']
          }
        ]
      }
    },
    required: ['auth']
  }
};

export async function handleSetAuthConfig(
  args: any,
  context: { httpClient: any }
): Promise<any> {
  try {
    const { auth } = args;
    
    // Set authentication in the HTTP client
    context.httpClient.setAuth(auth);
    
    // Prepare response based on auth type
    let message = '';
    switch (auth.type) {
      case 'bearer':
        message = `Bearer token authentication configured${auth.prefix ? ` with prefix "${auth.prefix}"` : ''}`;
        break;
      case 'basic':
        message = `Basic authentication configured for user "${auth.username}"`;
        break;
      case 'apikey':
        message = `API Key authentication configured${auth.header ? ` with header "${auth.header}"` : ''}`;
        break;
      case 'oauth2':
        message = `OAuth2 authentication configured for client "${auth.clientId}"`;
        if (auth.grantType) {
          message += ` using ${auth.grantType} grant`;
        }
        break;
    }
    
    return {
      success: true,
      message,
      authType: auth.type,
      configured: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure authentication',
      configured: false
    };
  }
}