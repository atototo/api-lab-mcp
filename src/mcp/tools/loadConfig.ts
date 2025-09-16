import { z } from 'zod';
import { ConfigManager } from '../../core/services/ConfigManager';
import * as path from 'path';

export const loadConfigTool = {
  name: 'load_config',
  description: 'Load API testing configuration from a JSON file',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the configuration file (JSON format)'
      },
      environment: {
        type: 'string',
        description: 'Environment to activate after loading'
      }
    },
    required: ['filePath']
  }
};

export async function handleLoadConfig(
  args: any,
  context: { configManager: ConfigManager; httpClient: any }
): Promise<any> {
  try {
    const { filePath, environment } = args;
    
    // Resolve file path
    const resolvedPath = path.resolve(filePath);
    
    // Load configuration file
    const config = await context.configManager.loadConfigFile(resolvedPath);
    
    // Get available environments
    const environments = Object.keys(config.environments);
    
    // Set environment if specified
    let activeEnvironment = null;
    let resolvedConfig = null;
    
    if (environment) {
      try {
        resolvedConfig = context.configManager.setEnvironment(environment);
        activeEnvironment = environment;
        
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
      } catch (error) {
        // Environment not found, but config is still loaded
        console.error(`Warning: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      success: true,
      message: `Configuration loaded from ${resolvedPath}`,
      configPath: resolvedPath,
      version: config.version,
      environments: environments,
      activeEnvironment,
      defaults: config.defaults,
      variables: config.variables,
      ...(resolvedConfig && {
        resolvedConfig: {
          name: resolvedConfig.name,
          baseURL: resolvedConfig.baseURL,
          headers: resolvedConfig.headers,
          timeout: resolvedConfig.timeout,
          hasAuth: !!resolvedConfig.auth
        }
      })
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load configuration',
      suggestion: 'Ensure the file exists and is valid JSON format'
    };
  }
}