export interface Admin {
  name: string;
  email: string;
}

export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: 
      | 'validation_failed'
      | 'invalid_credentials'
      | 'otp_required'
      | 'otp_invalid'
      | 'otp_expired'
      | 'otp_locked'
      | 'account_locked'
      | 'ip_blocked'
      | 'unauthenticated'
      | 'session_expired'
      | 'csrf_failed'
      | 'forbidden'
      | 'not_found'
      | 'rate_limited'
      | 'server_error';
    message: string;
    fields?: Record<string, string>;
    request_id?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface VariantHistoryItem {
  id: string;
  variant_id: string;
  admin_name: string;
  timestamp: string; // ISO string or formatted IST
  old_quantity: number;
  new_quantity: number;
  reason: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  color_hex?: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'Free size';
  available_quantity: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Draft' | 'Archived';
  image_placeholder_color: string;
  variants: ProductVariant[];
  held_units?: number; // Checkout in progress held units
}

export interface InventorySummary {
  this_month_orders: number;
  this_month_sales: number; // in paise
}

export interface InventoryResponse {
  summary: InventorySummary;
  products: Product[];
  updated_at: string; // IST formatted string
}
