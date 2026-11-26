/**
 * MOCK ONLY - remove
 * In-memory mock backend implementing all admin auth and inventory endpoints.
 */
import {
  MOCK_ADMIN_EMAIL,
  MOCK_ADMIN_NAME,
  MOCK_ADMIN_PASSWORD,
  MOCK_OTP_CODE,
  INITIAL_PRODUCTS,
  MOCK_SUMMARY,
  INITIAL_HISTORY,
} from './mockData';
import { Product, InventoryResponse, VariantHistoryItem } from '../types';
import { formatIST } from '../utils/formatters';

// In-memory state
let isAuthenticated = false;
let otpPending = false;
let failedPasswordAttempts = 0;
let lockoutUntil: number | null = null;

let failedOtpAttempts = 0;
let otpLockedUntil: number | null = null;

let resendCount = 0;
let resendWindowStart = Date.now();

let productsStore: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
let historyStore: Record<string, VariantHistoryItem[]> = JSON.parse(JSON.stringify(INITIAL_HISTORY));

// Helper to set cookie
function setCsrfCookie() {
  const token = 'csrf_token_' + Math.random().toString(36).substring(2);
  document.cookie = `SARM_ADMIN_CSRF=${token}; path=/; SameSite=Lax`;
  return token;
}

function getCsrfCookie(): string | null {
  const match = document.cookie.match(new RegExp('(^| )SARM_ADMIN_CSRF=([^;]+)'));
  return match ? match[2] : null;
}

function clearCsrfCookie() {
  document.cookie = 'SARM_ADMIN_CSRF=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export const mockApi = {
  async post(url: string, body: any, headers?: Record<string, string>): Promise<{ status: number; headers?: Record<string, string>; json: any }> {
    // Simulate slight network delay
    await new Promise((res) => setTimeout(res, 300));

    // Check CSRF for mutating requests
    if (['/api/admin/auth/login', '/api/admin/auth/otp/verify', '/api/admin/auth/otp/resend', '/api/admin/auth/logout', '/api/admin/auth/change-password'].includes(url) || url.startsWith('/api/admin/inventory/variants/')) {
      const csrfHeader = headers?.['X-CSRF-Token'];
      const csrfCookie = getCsrfCookie();
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return {
          status: 403,
          json: {
            ok: false,
            error: {
              code: 'csrf_failed',
              message: 'CSRF token verification failed',
            },
          },
        };
      }
    }

    if (url === '/api/admin/auth/login') {
      const { email, password } = body || {};
      
      // Check lockout
      if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
        return {
          status: 423,
          headers: { 'Retry-After': String(remainingSeconds) },
          json: {
            ok: false,
            error: {
              code: 'account_locked',
              message: 'Too many failed attempts. Try again later.',
            },
          },
        };
      }

      if (!email || !password || password.length < 12) {
        return {
          status: 422,
          json: {
            ok: false,
            error: {
              code: 'validation_failed',
              message: 'Password must be at least 12 characters',
              fields: { password: 'Password must be at least 12 characters' },
            },
          },
        };
      }

      if (email === MOCK_ADMIN_EMAIL && password === MOCK_ADMIN_PASSWORD) {
        failedPasswordAttempts = 0;
        lockoutUntil = null;
        otpPending = true; // Trigger 2FA OTP flow
        setCsrfCookie();
        return {
          status: 401, // otp_required is HTTP 401
          json: {
            ok: false,
            error: {
              code: 'otp_required',
              message: 'OTP verification required',
            },
          },
        };
      } else {
        failedPasswordAttempts++;
        if (failedPasswordAttempts >= 5) {
          lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
          return {
            status: 423,
            headers: { 'Retry-After': '900' },
            json: {
              ok: false,
              error: {
                code: 'account_locked',
                message: 'Too many failed attempts. Try again later.',
              },
            },
          };
        }
        return {
          status: 401,
          json: {
            ok: false,
            error: {
              code: 'invalid_credentials',
              message: 'Email or password is incorrect',
            },
          },
        };
      }
    }

    if (url === '/api/admin/auth/otp/verify') {
      const { code } = body || {};
      if (otpLockedUntil && Date.now() < otpLockedUntil) {
        return {
          status: 423,
          json: {
            ok: false,
            error: {
              code: 'otp_locked',
              message: 'Too many failed attempts. Try again later.',
            },
          },
        };
      }

      if (!otpPending) {
        return {
          status: 401,
          json: {
            ok: false,
            error: {
              code: 'unauthenticated',
              message: 'No OTP session pending',
            },
          },
        };
      }

      if (code === MOCK_OTP_CODE) {
        failedOtpAttempts = 0;
        otpPending = false;
        isAuthenticated = true;
        const token = setCsrfCookie();
        return {
          status: 200,
          json: {
            ok: true,
            data: {
              admin: { name: MOCK_ADMIN_NAME, email: MOCK_ADMIN_EMAIL },
              csrf_token: token,
            },
          },
        };
      } else {
        failedOtpAttempts++;
        if (failedOtpAttempts >= 5) {
          otpLockedUntil = Date.now() + 15 * 60 * 1000;
          otpPending = false;
          return {
            status: 423,
            json: {
              ok: false,
              error: {
                code: 'otp_locked',
                message: 'Too many failed attempts. Try again later.',
              },
            },
          };
        }
        return {
          status: 401,
          json: {
            ok: false,
            error: {
              code: 'otp_invalid',
              message: 'Invalid verification code. Please try again.',
            },
          },
        };
      }
    }

    if (url === '/api/admin/auth/otp/resend') {
      const now = Date.now();
      if (now - resendWindowStart > 3600000) {
        resendCount = 0;
        resendWindowStart = now;
      }
      if (resendCount >= 3) {
        return {
          status: 429,
          headers: { 'Retry-After': '3600' },
          json: {
            ok: false,
            error: {
              code: 'rate_limited',
              message: 'Too many failed attempts. Try again later.',
            },
          },
        };
      }
      resendCount++;
      return {
        status: 200,
        json: { ok: true, data: { message: 'New code sent' } },
      };
    }

    if (url === '/api/admin/auth/logout') {
      isAuthenticated = false;
      otpPending = false;
      clearCsrfCookie();
      return {
        status: 200,
        json: { ok: true, data: {} },
      };
    }

    if (url === '/api/admin/auth/forgot-password') {
      // Always generic success message
      return {
        status: 200,
        json: {
          ok: true,
          data: { message: 'If this account exists, a code has been sent.' },
        },
      };
    }

    if (url === '/api/admin/auth/reset-password') {
      const { code, new_password } = body || {};
      if (!new_password || new_password.length < 12) {
        return {
          status: 422,
          json: {
            ok: false,
            error: {
              code: 'validation_failed',
              message: 'Password must be at least 12 characters',
            },
          },
        };
      }
      if (code !== MOCK_OTP_CODE) {
        return {
          status: 401,
          json: {
            ok: false,
            error: { code: 'otp_invalid', message: 'Invalid code' },
          },
        };
      }
      return {
        status: 200,
        json: { ok: true, data: { message: 'Password reset successfully' } },
      };
    }

    if (url === '/api/admin/auth/change-password') {
      if (!isAuthenticated) {
        return {
          status: 401,
          json: { ok: false, error: { code: 'session_expired', message: 'Session expired' } },
        };
      }
      const { current_password, new_password } = body || {};
      if (current_password !== MOCK_ADMIN_PASSWORD) {
        return {
          status: 422,
          json: {
            ok: false,
            error: { code: 'validation_failed', message: 'Current password is incorrect', fields: { current_password: 'Incorrect password' } },
          },
        };
      }
      if (!new_password || new_password.length < 12) {
        return {
          status: 422,
          json: {
            ok: false,
            error: { code: 'validation_failed', message: 'New password must be at least 12 characters', fields: { new_password: 'Min 12 characters' } },
          },
        };
      }
      isAuthenticated = false; // force sign in again after success
      clearCsrfCookie();
      return {
        status: 200,
        json: { ok: true, data: { message: 'Password changed. Please sign in again.' } },
      };
    }

    if (url.startsWith('/api/admin/inventory/variants/')) {
      if (!isAuthenticated) {
        return {
          status: 401,
          json: { ok: false, error: { code: 'session_expired', message: 'Your session expired, please sign in again' } },
        };
      }
      const parts = url.split('/');
      const variantId = parts[5]; // /api/admin/inventory/variants/{id}
      const { quantity, reason } = body || {};

      if (typeof quantity !== 'number' || quantity < 0 || !reason || !reason.trim()) {
        return {
          status: 422,
          json: {
            ok: false,
            error: {
              code: 'validation_failed',
              message: 'Quantity and reason are required',
            },
          },
        };
      }

      // Find variant in productsStore
      let foundVariant: any = null;
      for (const prod of productsStore) {
        const v = prod.variants.find((item) => item.id === variantId);
        if (v) {
          foundVariant = v;
          break;
        }
      }

      if (!foundVariant) {
        return {
          status: 404,
          json: { ok: false, error: { code: 'not_found', message: 'Variant not found' } },
        };
      }

      const oldQty = foundVariant.available_quantity;
      foundVariant.available_quantity = quantity;

      // Add to history
      if (!historyStore[variantId]) {
        historyStore[variantId] = [];
      }
      historyStore[variantId].unshift({
        id: 'hist-' + Math.random().toString(36).substring(2),
        variant_id: variantId,
        admin_name: MOCK_ADMIN_NAME,
        timestamp: new Date().toISOString(),
        old_quantity: oldQty,
        new_quantity: quantity,
        reason: reason.trim(),
      });

      return {
        status: 200,
        json: { ok: true, data: foundVariant },
      };
    }

    return {
      status: 404,
      json: { ok: false, error: { code: 'not_found', message: 'Not found' } },
    };
  },

  async get(url: string, headers?: Record<string, string>): Promise<{ status: number; headers?: Record<string, string>; json: any }> {
    await new Promise((res) => setTimeout(res, 250));

    if (url === '/api/admin/auth/me') {
      if (!isAuthenticated) {
        return {
          status: 401,
          json: { ok: false, error: { code: 'session_expired', message: 'Your session expired, please sign in again' } },
        };
      }
      return {
        status: 200,
        json: { ok: true, data: { admin: { name: MOCK_ADMIN_NAME, email: MOCK_ADMIN_EMAIL } } },
      };
    }

    if (url === '/api/admin/inventory') {
      if (!isAuthenticated) {
        return {
          status: 401,
          json: { ok: false, error: { code: 'session_expired', message: 'Your session expired, please sign in again' } },
        };
      }
      const responseData: InventoryResponse = {
        summary: MOCK_SUMMARY,
        products: productsStore,
        updated_at: formatIST(new Date()),
      };
      return {
        status: 200,
        json: { ok: true, data: responseData },
      };
    }

    if (url.includes('/history')) {
      if (!isAuthenticated) {
        return {
          status: 401,
          json: { ok: false, error: { code: 'session_expired', message: 'Your session expired, please sign in again' } },
        };
      }
      // /api/admin/inventory/variants/{id}/history
      const parts = url.split('/');
      const variantId = parts[5];
      const items = historyStore[variantId] || [];
      return {
        status: 200,
        json: { ok: true, data: items },
      };
    }

    return {
      status: 404,
      json: { ok: false, error: { code: 'not_found', message: 'Not found' } },
    };
  },
};

// Initialize CSRF cookie if not present
if (!getCsrfCookie()) {
  setCsrfCookie();
}
