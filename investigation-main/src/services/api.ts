/* eslint-disable */
import defaultSettings from '@/config/defaultSettings.json';

// Get API configuration from environment variables or default settings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || defaultSettings.api.baseUrl;
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || defaultSettings.api.timeout;
const API_RETRY_ATTEMPTS = Number(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS) || defaultSettings.api.retryAttempts;
const ENABLE_MOCK_API = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

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
      const response = await Promise.race([fetchPromise, timeoutPromise(timeout)]);

      if (!response.ok) {
        // For 404 errors on /api/augment/* endpoints, check if we're using the correct API base URL
        if (response.status === 404 && url.includes('/api/augment/')) {
          console.warn(`404 Not Found for ${url}. Check if the API endpoint exists and API_BASE_URL is correct.`);

          // Special handling for suggested questions endpoint
          if (url.includes('/api/augment/suggested-questions')) {
            console.log('Detected suggested questions endpoint, trying alternative approaches');

            // Try with direct fetch to the Next.js API route
            try {
              const nextJsApiUrl = `/api/augment/suggested-questions${url.includes('?') ? url.substring(url.indexOf('?')) : ''}`;
              console.log(`Trying Next.js API route: ${nextJsApiUrl}`);

              const nextJsResponse = await fetch(nextJsApiUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              if (nextJsResponse.ok) {
                console.log(`Next.js API route ${nextJsApiUrl} succeeded`);
                return await nextJsResponse.json();
              } else {
                console.warn(`Next.js API route ${nextJsApiUrl} failed: ${nextJsResponse.status} ${nextJsResponse.statusText}`);
              }
            } catch (nextJsError) {
              console.error(`Next.js API route failed:`, nextJsError);
            }
          }

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

// Mock API implementation for development
export const mockApiService = {
  get: async <T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`Mock API GET request: ${endpoint}`);

    // Extract the base endpoint without query parameters
    const [baseEndpoint, queryString] = endpoint.split('?');

    return import('@/mocks/api').then(module => {
      // First check if there's a handler for this endpoint
      const mockHandler = module.mockHandlers[baseEndpoint]?.get;

      if (mockHandler) {
        console.log(`Using mock handler for ${baseEndpoint}`);
        // Pass the full endpoint including query string to the handler
        return mockHandler(options.headers, endpoint) as T;
      }

      // If no handler, try to get static mock data
      const mockData = module.default[baseEndpoint] || module.default[endpoint];

      if (mockData) {
        console.log(`Using static mock data for ${endpoint}`);
        return mockData as T;
      }

      // No mock data found
      console.error(`No mock data for endpoint: ${endpoint}`);
      throw new ApiError(`No mock data for endpoint: ${endpoint}`, 404);
    });
  },

  post: async <T>(endpoint: string, data: any, options: Omit<RequestOptions, 'method'> = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock response
    return import('@/mocks/api').then(module => {
      const mockHandler = module.mockHandlers[endpoint]?.post;
      if (!mockHandler) {
        throw new ApiError(`No mock handler for POST ${endpoint}`, 404);
      }
      return mockHandler(data, options.headers) as T;
    });
  },

  put: async <T>(endpoint: string, data: any, options: Omit<RequestOptions, 'method'> = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock response
    return import('@/mocks/api').then(module => {
      const mockHandler = module.mockHandlers[endpoint]?.put;
      if (!mockHandler) {
        throw new ApiError(`No mock handler for PUT ${endpoint}`, 404);
      }
      return mockHandler(data, options.headers) as T;
    });
  },

  delete: async <T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock response
    return import('@/mocks/api').then(module => {
      const mockHandler = module.mockHandlers[endpoint]?.delete;
      if (!mockHandler) {
        throw new ApiError(`No mock handler for DELETE ${endpoint}`, 404);
      }
      return mockHandler(options.headers) as T;
    });
  },
};

// Export the appropriate API service based on configuration
const selectedApiService = ENABLE_MOCK_API ? mockApiService : apiService;
export default selectedApiService;
