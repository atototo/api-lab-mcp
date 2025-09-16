import { z } from 'zod';
import { ConfigManager } from '../../core/services/ConfigManager';

export const setEnvironmentTool = {
  name: 'set_environment',
  description: 'Switch to a different environment from the loaded configuration',
  inputSchema: {
    type: 'object',
    properties: {
      environment: {
        type: 'string',
        description: 'Name of the environment to activate'
      }
    },
    required: ['environment']
  }
};

export async function handleSetEnvironment(
  args: any,
  context: { configManager: ConfigManager; httpClient: any }
): Promise<any> {
  try {
    const { environment } = args;
    
    // Check if config is loaded
    const environments = context.configManager.getEnvironments();
    if (environments.length === 0) {
      return {
        success: false,
        error: 'No configuration file loaded',
        suggestion: 'Use load_config tool first to load a configuration file'
      };
    }
    
    // Set the environment
    const resolvedConfig = context.configManager.setEnvironment(environment);
    
    // Apply configuration to HTTP client
    const httpConfig = context.configManager.exportForHttpClient();
    if (httpConfig) {
      if (httpConfig.baseURL) {
        context.httpClient.setBaseURL(httpConfig.baseURL);
      }
      if (httpConfig.headers) {
        context.httpClient.setDefaultHeaders(httpConfig.headers);
      }
      if (httpConfig.auth) {
        context.httpClient.setAuth(httpConfig.auth);
      }
    }
    
    return {
      success: true,
      message: `Switched to ${environment} environment`,
      environment,
      config: {
        name: resolvedConfig.name,
        baseURL: resolvedConfig.baseURL,
        headers: resolvedConfig.headers,
        timeout: resolvedConfig.timeout,
        retryAttempts: resolvedConfig.retryAttempts,
        retryDelay: resolvedConfig.retryDelay,
        hasAuth: !!resolvedConfig.auth,
        variables: resolvedConfig.variables
      },
      appliedToClient: {
        baseURL: httpConfig?.baseURL || null,
        headersCount: Object.keys(httpConfig?.headers || {}).length,
        authConfigured: !!httpConfig?.auth
      }
    };
    
  } catch (error) {
    // Get available environments for helpful error message
    const available = context.configManager.getEnvironments();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set environment',
      availableEnvironments: available,
      currentEnvironment: context.configManager.getCurrentEnvironment()
    };
  }
}