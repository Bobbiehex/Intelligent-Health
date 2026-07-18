import { useState, useEffect, useRef } from 'react';

// In-memory cache for SWR
const swrCache = new Map<string, { data: any; timestamp: number }>();
// Deduping in-flight requests
const activeRequests = new Map<string, Promise<any>>();

// SSE Real-time Synchronization Listeners
const sseListeners = new Set<() => void>();

export function registerSseListener(callback: () => void) {
  sseListeners.add(callback);
  return () => {
    sseListeners.delete(callback);
  };
}

if (typeof window !== 'undefined') {
  let eventSource: EventSource | null = null;
  const connectSse = () => {
    if (eventSource) return;
    eventSource = new EventSource('/api/realtime');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.action === 'refresh') {
          sseListeners.forEach((listener) => {
            try {
              listener();
            } catch (err) {
              console.error('Error invoking SWR live update listener:', err);
            }
          });
        }
      } catch (err) {
        // Fail silently or log
      }
    };
    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setTimeout(connectSse, 3000);
    };
  };
  connectSse();
}

export interface FetchOptions extends RequestInit {
  token?: string | null;
}

/**
 * Custom fetcher with exponential backoff retry logic for 429 and transient errors.
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}, retries = 3, delay = 500): Promise<any> {
  const token = options.token || localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 429 || response.status >= 500) {
      if (retries > 0) {
        console.warn(`Rate limit or transient error (${response.status}) hit on ${url}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
    }

    if ((response.status === 401 || response.status === 403) && !url.includes('/api/auth/refresh')) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          console.warn(`Access token expired or unauthorized (${response.status}) on ${url}. Attempting silent token refresh...`);
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData && refreshData.accessToken) {
              localStorage.setItem('token', refreshData.accessToken);
              
              // Retry the original request with the new token
              const newHeaders = new Headers(options.headers || {});
              newHeaders.set('Authorization', `Bearer ${refreshData.accessToken}`);
              const newFetchOptions: FetchOptions = {
                ...options,
                headers: newHeaders,
              };
              
              console.log(`Token refreshed successfully. Retrying request to ${url}...`);
              const retryResponse = await fetch(url, newFetchOptions as RequestInit);
              if (retryResponse.ok) {
                const contentType = retryResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  return await retryResponse.json();
                }
                return await retryResponse.text();
              } else {
                const contentType = retryResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const errData = await retryResponse.json();
                  throw new Error(errData.error || errData.message || `Retry failed with status ${retryResponse.status}`);
                }
                throw new Error(`Retry failed with status ${retryResponse.status}`);
              }
            }
          } else {
            // If the refresh token is invalid or expired, force a clean logout
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/';
          }
        } catch (refreshErr) {
          console.error('Silent token refresh failed:', refreshErr);
        }
      }
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || `Request failed with status ${response.status}`);
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error: any) {
    if (retries > 0 && (
      error.message?.includes('fetch') || 
      error.message?.includes('Closed') || 
      error.message?.includes('socket') || 
      error.message?.includes('network') ||
      error.message?.includes('Failed to fetch')
    )) {
      console.warn(`Network error on ${url}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Deduplicated fetcher to prevent duplicate simultaneous in-flight requests.
 */
export function fetchDeduplicated(url: string, options: FetchOptions = {}): Promise<any> {
  const cacheKey = `${options.method || 'GET'}:${url}`;
  
  if (activeRequests.has(cacheKey)) {
    return activeRequests.get(cacheKey)!;
  }

  const promise = fetchWithRetry(url, options)
    .finally(() => {
      activeRequests.delete(cacheKey);
    });

  activeRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Stale-While-Revalidate custom hook for beautiful, cached, and performant data fetching.
 */
export function useSWR<T>(url: string | null, options: FetchOptions = {}, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(() => {
    if (!url) return null;
    const cached = swrCache.get(url);
    return cached ? (cached.data as T) : null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    if (!url) return false;
    return !swrCache.has(url);
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!url) {
      setData(null);
      setIsLoading(false);
      setIsValidating(false);
      return;
    }

    let isMounted = true;

    // Check cache
    const cached = swrCache.get(url);
    if (cached) {
      setData(cached.data);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const triggerFetch = async () => {
      setIsValidating(true);
      try {
        const freshData = await fetchDeduplicated(url, optionsRef.current);
        if (isMounted) {
          swrCache.set(url, { data: freshData, timestamp: Date.now() });
          setData(freshData);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsValidating(false);
        }
      }
    };

    triggerFetch();

    const unsubscribe = registerSseListener(() => {
      if (isMounted) {
        triggerFetch();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [url, ...dependencies]);

  const mutate = async (newData?: T) => {
    if (!url) return;
    if (newData !== undefined) {
      swrCache.set(url, { data: newData, timestamp: Date.now() });
      setData(newData);
    } else {
      setIsValidating(true);
      try {
        const freshData = await fetchDeduplicated(url, optionsRef.current);
        swrCache.set(url, { data: freshData, timestamp: Date.now() });
        setData(freshData);
        setError(null);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsValidating(false);
      }
    }
  };

  return { data, error, isLoading, isValidating, mutate };
}
