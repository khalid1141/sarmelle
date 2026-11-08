import type { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface AppliedCoupon {
  code: string;
  discountPercent: number;
  discountAmount?: number;
}
