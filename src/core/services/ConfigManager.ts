import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { 
  ConfigFile, 
  EnvironmentConfig, 
  LoadedConfig,
  ConfigFileSchema 
} from '../../types/config';
import { AuthConfig } from '../../types/auth';

export class ConfigManager {
  private configFile: ConfigFile | null = null;
  private configPath: string | null = null;
  private currentEnvironment: string | null = null;
  private resolvedConfig: EnvironmentConfig | null = null;

  constructor() {}

  /**
   * Load configuration from a file
   */
  async loadConfigFile(filePath: string): Promise<ConfigFile> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse based on file extension
      let rawConfig: any;
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.json') {
        rawConfig = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        // For YAML support, you would need to add a YAML parser dependency
        // For now, we'll only support JSON
        throw new Error('YAML configuration files are not yet supported. Please use JSON format.');
      } else {
        // Try to parse as JSON by default
        rawConfig = JSON.parse(content);
      }
      
      // Validate configuration
      const config = ConfigFileSchema.parse(rawConfig);
      
      // Store configuration
      this.configFile = config;
      this.configPath = filePath;
      
      return config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid configuration file: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw new Error(`Failed to load configuration file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set the current environment
   */
  setEnvironment(environment: string): EnvironmentConfig {
    if (!this.configFile) {
      throw new Error('No configuration file loaded. Please load a configuration file first.');
    }
    
    if (!this.configFile.environments[environment]) {
      const available = Object.keys(this.configFile.environments).join(', ');
      throw new Error(`Environment "${environment}" not found. Available environments: ${available}`);
    }
    
    this.currentEnvironment = environment;
    this.resolvedConfig = this.resolveConfig(environment);
    
    return this.resolvedConfig;
  }

  /**
   * Get the current environment name
   */
  getCurrentEnvironment(): string | null {
    return this.currentEnvironment;
  }

  /**
   * Get the resolved configuration for the current environment
   */
  getConfig(): EnvironmentConfig | null {
    return this.resolvedConfig;
  }

  /**
   * Get all available environments
   */
  getEnvironments(): string[] {
    if (!this.configFile) {
      return [];
    }
    return Object.keys(this.configFile.environments);
  }

  /**
   * Resolve configuration with defaults and variable substitution
   */
  private resolveConfig(environment: string): EnvironmentConfig {
    if (!this.configFile) {
      throw new Error('No configuration file loaded');
    }
    
    const envConfig = this.configFile.environments[environment];
    const defaults = this.configFile.defaults || {};
    const globalVars = this.configFile.variables || {};
    
    // Merge with defaults
    const merged: EnvironmentConfig = {
      ...defaults,
      ...envConfig,
      headers: {
        ...defaults.headers,
        ...envConfig.headers
      },
      variables: {
        ...globalVars,
        ...defaults.variables,
        ...envConfig.variables
      }
    };
    
    // Perform variable substitution
    const resolved = this.substituteVariables(merged);
    
    return resolved;
  }

  /**
   * Substitute variables in configuration values
   */
  private substituteVariables(config: EnvironmentConfig): EnvironmentConfig {
    const variables = config.variables || {};
    
    // Also include environment variables
    const allVars: Record<string, string> = {
      ...variables,
      ...Object.fromEntries(
        Object.entries(process.env)
          .filter(([key]) => key.startsWith('API_FORGE_'))
          .map(([key, value]) => [key.replace('API_FORGE_', ''), value || ''])
      )
    };
    
    // Helper function to replace variables in a string
    const replaceVars = (str: string): string => {
      return str.replace(/\${([^}]+)}/g, (match, varName) => {
        return allVars[varName] || match;
      });
    };
    
    // Deep clone and substitute
    const result: EnvironmentConfig = JSON.parse(JSON.stringify(config));
    
    // Substitute in baseURL
    if (result.baseURL) {
      result.baseURL = replaceVars(result.baseURL);
    }
    
    // Substitute in headers
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        result.headers[key] = replaceVars(value);
      }
    }
    
    // Substitute in auth config (if it's a string type)
    if (result.auth) {
      result.auth = this.substituteInObject(result.auth, replaceVars);
    }
    
    return result;
  }

  /**
   * Recursively substitute variables in an object
   */
  private substituteInObject(obj: any, replaceFn: (str: string) => string): any {
    if (typeof obj === 'string') {
      return replaceFn(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteInObject(item, replaceFn));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteInObject(value, replaceFn);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Save current configuration to file
   */
  async saveConfig(): Promise<void> {
    if (!this.configFile || !this.configPath) {
      throw new Error('No configuration file loaded');
    }
    
    const content = JSON.stringify(this.configFile, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');
  }

  /**
   * Create a new configuration file
   */
  async createConfigFile(filePath: string, config: ConfigFile): Promise<void> {
    // Validate configuration
    const validConfig = ConfigFileSchema.parse(config);
    
    // Save to file
    const content = JSON.stringify(validConfig, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Load the new configuration
    await this.loadConfigFile(filePath);
  }

  /**
   * Export configuration for HTTP client
   */
  exportForHttpClient(): {
    baseURL?: string;
    headers?: Record<string, string>;
    auth?: AuthConfig;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } | null {
    if (!this.resolvedConfig) {
      return null;
    }
    
    return {
      baseURL: this.resolvedConfig.baseURL,
      headers: this.resolvedConfig.headers,
      auth: this.resolvedConfig.auth,
      timeout: this.resolvedConfig.timeout,
      retryAttempts: this.resolvedConfig.retryAttempts,
      retryDelay: this.resolvedConfig.retryDelay
    };
  }

  /**
   * Get example configuration
   */
  static getExampleConfig(): ConfigFile {
    return {
      version: '1.0',
      defaults: {
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 1000,
        headers: {
          'User-Agent': 'API-Forge/1.0'
        }
      },
      variables: {
        'API_VERSION': 'v1',
        'DOMAIN': 'api.example.com'
      },
      environments: {
        development: {
          name: 'Development',
          baseURL: 'http://localhost:3000/${API_VERSION}',
          headers: {
            'X-Environment': 'dev'
          }
        },
        staging: {
          name: 'Staging',
          baseURL: 'https://staging.${DOMAIN}/${API_VERSION}',
          auth: {
            type: 'bearer',
            token: '${STAGING_TOKEN}'
          },
          headers: {
            'X-Environment': 'staging'
          }
        },
        production: {
          name: 'Production',
          baseURL: 'https://${DOMAIN}/${API_VERSION}',
          auth: {
            type: 'bearer',
            token: '${PROD_TOKEN}'
          },
          headers: {
            'X-Environment': 'production'
          },
          timeout: 60000
        }
      }
    };
  }
}