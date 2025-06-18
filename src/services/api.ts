/* eslint-disable */
import defaultSettings from '@/config/defaultSettings.json';

// Get API configuration from environment variables or default settings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || defaultSettings.api.baseUrl;
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || defaultSettings.api.timeout;
const API_RETRY_ATTEMPTS = Number(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS) || defaultSettings.api.retryAttempts;


// API request options
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
}

// API error class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Timeout promise
const timeoutPromise = (ms: number) => new Promise((_, reject) => {
  setTimeout(() => reject(new ApiError('Request timeout', 408)), ms);
});

// Fetch with timeout and retry
export const fetchWithRetry = async (url: string, options: RequestOptions = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = API_TIMEOUT,
    retryAttempts = API_RETRY_ATTEMPTS
  } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  let lastError: Error | null = null;

  console.log(`API Request: ${method} ${url}`);

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}/${retryAttempts} for ${url}`);
      }

      const fetchPromise = fetch(url, fetchOptions);
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(timeout).then(() => {
          throw new Error(`Request timed out after ${timeout}ms`);
        })
      ]) as Response;

      if (!response.ok) {
        // For 404 errors on /api/augment/* endpoints, check if we're using the correct API base URL
        if (response.status === 404 && url.includes('/api/augment/')) {
          console.warn(`404 Not Found for ${url}. Check if the API endpoint exists and API_BASE_URL is correct.`);



          // If we're using a custom API_BASE_URL, try with the default /api base URL
          if (API_BASE_URL !== '/api' && !url.startsWith('/api/')) {
            const fallbackUrl = url.replace(API_BASE_URL, '/api');
            console.log(`Trying fallback URL: ${fallbackUrl}`);

            try {
              const fallbackResponse = await fetch(fallbackUrl, fetchOptions);
              if (fallbackResponse.ok) {
                console.log(`Fallback URL ${fallbackUrl} succeeded`);
                return await fallbackResponse.json();
              }
            } catch (fallbackError) {
              console.error(`Fallback URL ${fallbackUrl} failed:`, fallbackError);
            }
          }
        }

        throw new ApiError(`API error: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      console.log(`API Response for ${url}: Success`);
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`API Error for ${url}:`, error);

      // Don't retry if it's a client error (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retryAttempts - 1) {
        const backoffTime = 2 ** attempt * 1000;
        console.log(`Waiting ${backoffTime}ms before retry ${attempt + 1}/${retryAttempts}`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  throw lastError || new Error('Request failed');
};

// Base API service
export const apiService = {
  get: <T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    fetchWithRetry(`${API_BASE_URL}${endpoint}`, { ...options, method: 'GET' }) as Promise<T>,

  post: <T>(endpoint: string, data: any, options: Omit<RequestOptions, 'method'> = {}) =>
    fetchWithRetry(`${API_BASE_URL}${endpoint}`, { ...options, method: 'POST', body: data }) as Promise<T>,

  put: <T>(endpoint: string, data: any, options: Omit<RequestOptions, 'method'> = {}) =>
    fetchWithRetry(`${API_BASE_URL}${endpoint}`, { ...options, method: 'PUT', body: data }) as Promise<T>,

  delete: <T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    fetchWithRetry(`${API_BASE_URL}${endpoint}`, { ...options, method: 'DELETE' }) as Promise<T>,
};

// Export the API service for production use
export default apiService;
