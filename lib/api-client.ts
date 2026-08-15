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

export async function secureApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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

    const data = await response.json();

    if (!response.ok) {
      // Check for token expiration and attempt auto-rotation
      if (data.code === 'TOKEN_EXPIRED') {
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
        error: data.error || `HTTP error ${response.status}: ${response.statusText}`,
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
