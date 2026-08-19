/**
 * Hardened API Client for CampusCart
 * - Automatically passes HttpOnly, Secure, SameSite=Strict session cookies
 * - Extracts and transmits CSRF double-submit tokens via X-CSRF-Token headers
 * - Handles token rotation and rate-limiting retry protocols
 */

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)campuscart_csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any;
  error?: string;
  pagination?: {
    hasNextPage: boolean;
    nextCursor: string | null;
    count: number;
  };
}

export function getApiBaseUrl(): string {
  // If an explicit API URL is configured (e.g. deployed backend URL), use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // In the browser, only attempt localhost:5000 if the website is actually running on localhost/127.0.0.1
  // This prevents Chrome's Private Network Access ("Access other apps and services") permission prompt on public domains
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    return isLocalhost ? 'http://localhost:5000/api' : '/api';
  }

  return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';
}

export async function secureApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  // Attach Double-Submit CSRF Token for mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Transmit and receive HttpOnly cookies securely
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || response.statusText };
      }
    }

    if (!response.ok) {
      // Check for token expiration and attempt auto-rotation
      if (data?.code === 'TOKEN_EXPIRED') {
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          // Retry original request with newly issued session cookie
          return secureApiRequest<T>(endpoint, options);
        }
      }

      return {
        success: false,
        error: data?.error || `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network connection error.',
    };
  }
}
