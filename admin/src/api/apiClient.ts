/**
 * src/api/apiClient.ts: The ONLY place that talks to the backend (or mockApi).
 */
import { ApiResponse } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  json: any;
}

function getCsrfToken(): string {
  const match = document.cookie.match(new RegExp('(^| )SARM_ADMIN_CSRF=([^;]+)'));
  return match ? match[2] : '';
}

async function handleResponse(res: Response): Promise<ApiResponse> {
  try {
    const retryAfter = res.headers.get('Retry-After');
    const data = await res.json();
    if (!data.ok && data.error && retryAfter) {
      data.error.retryAfterSeconds = parseInt(retryAfter, 10);
    }
    return data as ApiResponse;
  } catch {
    return {
      ok: false,
      error: {
        code: 'server_error',
        message: 'Something went wrong. Try again.',
      },
    };
  }
}

export const apiClient = {
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    if (USE_MOCK) {
      try {
        const { mockApi } = await import('./mockApi');
        const res = (await mockApi.get(endpoint)) as MockResponse;
        const data = res.json;
        if (!data.ok && data.error && res.headers?.['Retry-After']) {
          data.error.retryAfterSeconds = parseInt(res.headers['Retry-After'], 10);
        }
        return data as ApiResponse<T>;
      } catch {
        return {
          ok: false,
          error: {
            code: 'server_error',
            message: 'Something went wrong. Try again.',
          },
        };
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
        },
      });
      return (await handleResponse(res)) as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'server_error',
          message: 'Something went wrong. Try again.',
        },
      };
    }
  },

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (USE_MOCK) {
      try {
        const { mockApi } = await import('./mockApi');
        const res = (await mockApi.post(endpoint, body, headers)) as MockResponse;
        const data = res.json;
        if (!data.ok && data.error && res.headers?.['Retry-After']) {
          data.error.retryAfterSeconds = parseInt(res.headers['Retry-After'], 10);
        }
        return data as ApiResponse<T>;
      } catch {
        return {
          ok: false,
          error: {
            code: 'server_error',
            message: 'Something went wrong. Try again.',
          },
        };
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body ?? {}),
      });
      return (await handleResponse(res)) as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'server_error',
          message: 'Something went wrong. Try again.',
        },
      };
    }
  },

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (USE_MOCK) {
      try {
        const { mockApi } = await import('./mockApi');
        const res = (await mockApi.post(endpoint, body, headers)) as MockResponse;
        const data = res.json;
        if (!data.ok && data.error && res.headers?.['Retry-After']) {
          data.error.retryAfterSeconds = parseInt(res.headers['Retry-After'], 10);
        }
        return data as ApiResponse<T>;
      } catch {
        return {
          ok: false,
          error: {
            code: 'server_error',
            message: 'Something went wrong. Try again.',
          },
        };
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body ?? {}),
      });
      return (await handleResponse(res)) as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'server_error',
          message: 'Something went wrong. Try again.',
        },
      };
    }
  },

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (USE_MOCK) {
      try {
        const { mockApi } = await import('./mockApi');
        const res = (await mockApi.post(endpoint, body, headers)) as MockResponse;
        const data = res.json;
        if (!data.ok && data.error && res.headers?.['Retry-After']) {
          data.error.retryAfterSeconds = parseInt(res.headers['Retry-After'], 10);
        }
        return data as ApiResponse<T>;
      } catch {
        return {
          ok: false,
          error: {
            code: 'server_error',
            message: 'Something went wrong. Try again.',
          },
        };
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body ?? {}),
      });
      return (await handleResponse(res)) as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'server_error',
          message: 'Something went wrong. Try again.',
        },
      };
    }
  },

  async delete<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (USE_MOCK) {
      try {
        const { mockApi } = await import('./mockApi');
        const res = (await mockApi.post(endpoint, body, headers)) as MockResponse;
        const data = res.json;
        if (!data.ok && data.error && res.headers?.['Retry-After']) {
          data.error.retryAfterSeconds = parseInt(res.headers['Retry-After'], 10);
        }
        return data as ApiResponse<T>;
      } catch {
        return {
          ok: false,
          error: {
            code: 'server_error',
            message: 'Something went wrong. Try again.',
          },
        };
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body ?? {}),
      });
      return (await handleResponse(res)) as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'server_error',
          message: 'Something went wrong. Try again.',
        },
      };
    }
  },
};
