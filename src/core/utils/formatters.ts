/**
 * Formatting utilities for API responses and data presentation
 */

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(2)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format HTTP headers for display
 */
export function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * Truncate long strings with ellipsis
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format JSON with syntax highlighting (for terminal output)
 */
export function formatJson(data: any, indent: number = 2): string {
  try {
    return JSON.stringify(data, null, indent);
  } catch (error) {
    return '[Unable to format JSON]';
  }
}

/**
 * Create a summary of an HTTP response
 */
export function summarizeResponse(response: any): string {
  const lines = [
    `Status: ${response.status} ${response.statusText || ''}`,
    `Response Time: ${formatDuration(response.responseTime || 0)}`,
    `Size: ${formatBytes(response.size || 0)}`,
  ];

  if (response.headers && Object.keys(response.headers).length > 0) {
    lines.push(`Headers: ${Object.keys(response.headers).length} headers`);
  }

  if (response.body) {
    const bodyType = typeof response.body;
    if (bodyType === 'object') {
      const keys = Object.keys(response.body);
      lines.push(`Body: Object with ${keys.length} keys`);
    } else {
      lines.push(`Body: ${bodyType}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format error for display
 */
export function formatError(error: any): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  
  if (typeof error === 'object' && error !== null) {
    if (error.code && error.message) {
      return `${error.code}: ${error.message}`;
    }
    return formatJson(error);
  }
  
  return String(error);
}

/**
 * Format test result for display
 */
export function formatTestResult(params: {
  url: string;
  method: string;
  response?: any;
  validationReport?: any;
  error?: string | null;
}): any {
  const { url, method, response, validationReport, error } = params;
  
  const result: any = {
    success: !error && (!validationReport || validationReport.overallPassed),
    url,
    method,
  };
  
  if (response) {
    result.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      metrics: response.metrics
    };
  }
  
  if (validationReport) {
    result.validation = {
      totalAssertions: validationReport.totalAssertions,
      passedAssertions: validationReport.passedAssertions,
      failedAssertions: validationReport.failedAssertions,
      overallPassed: validationReport.overallPassed,
      results: validationReport.results
    };
  }
  
  if (error) {
    result.error = error;
  }
  
  return result;
}