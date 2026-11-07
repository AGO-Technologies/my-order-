// Helper to manage persistent browser device UUID
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('cafe_device_id');
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem('cafe_device_id', deviceId);
  }
  return deviceId;
}

// Helper to get CSRF token from document.cookie
export function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

export async function fetchCsrfToken(): Promise<string> {
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) return cookieToken;

  try {
    const res = await fetch('/api/auth/csrf/', {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken || '';
  } catch (err) {
    console.error('Failed to fetch CSRF token', err);
    return '';
  }
}

interface RequestOptions extends RequestInit {
  retryOn401?: boolean;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { retryOn401 = true, ...customConfig } = options;

  const headers = new Headers(customConfig.headers || {});
  
  if (!headers.has('Content-Type') && !(customConfig.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include CSRF token on state-changing methods
  const method = (customConfig.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = await fetchCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: 'include', // Ensure HttpOnly cookies are passed
  };

  const response = await fetch(endpoint, config);

  // If 401 Unauthorized and not already retrying, try to refresh token once
  if (response.status === 401 && retryOn401 && endpoint !== '/api/auth/login/' && endpoint !== '/api/auth/refresh/') {
    try {
      const refreshRes = await fetch('/api/auth/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await fetchCsrfToken(),
        },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // Retry the original request
        return apiRequest<T>(endpoint, { ...options, retryOn401: false });
      }
    } catch {
      // Refresh failed
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error: any = new Error(data.detail || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
