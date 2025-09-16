// Helper to convert Phase 4 tools to JSON Schema format

export const authSchema = {
  type: 'object',
  description: 'Authentication configuration',
  properties: {
    type: {
      type: 'string',
      enum: ['bearer', 'basic', 'apikey', 'oauth2'],
      description: 'Authentication type'
    },
    token: {
      type: 'string',
      description: 'Bearer token (for bearer auth)'
    },
    username: {
      type: 'string',
      description: 'Username (for basic auth)'
    },
    password: {
      type: 'string',
      description: 'Password (for basic auth)'
    },
    key: {
      type: 'string',
      description: 'API key (for apikey auth)'
    },
    header: {
      type: 'string',
      description: 'Header name for API key'
    },
    prefix: {
      type: 'string',
      description: 'Prefix for token or key'
    },
    clientId: {
      type: 'string',
      description: 'OAuth2 client ID'
    },
    clientSecret: {
      type: 'string',
      description: 'OAuth2 client secret'
    },
    accessToken: {
      type: 'string',
      description: 'OAuth2 access token'
    },
    refreshToken: {
      type: 'string',
      description: 'OAuth2 refresh token'
    },
    tokenUrl: {
      type: 'string',
      description: 'OAuth2 token URL'
    },
    grantType: {
      type: 'string',
      enum: ['client_credentials', 'authorization_code', 'refresh_token'],
      description: 'OAuth2 grant type'
    }
  },
  required: ['type']
};

export const assertionSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['status', 'header', 'body', 'bodyJson', 'bodyJsonPath', 'responseTime', 'contentType', 'contains', 'notContains', 'matches'],
      description: 'Type of assertion'
    },
    path: {
      type: 'string',
      description: 'Path for header name or JSONPath expression'
    },
    expected: {
      description: 'Expected value'
    },
    operator: {
      type: 'string',
      enum: ['equals', 'contains', 'lessThan', 'greaterThan', 'matches', 'exists'],
      description: 'Comparison operator'
    },
    message: {
      type: 'string',
      description: 'Custom error message'
    }
  },
  required: ['type', 'expected']
};