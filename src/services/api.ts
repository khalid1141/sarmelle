// src/services/api.ts
// Single frontend entry point for the Sarmelle REST API. All dynamic data
// (catalogue, campaign, reviews, account) flows through here. No mock data.

import type { Product, ProductReview } from '../types/product';
import type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from '../types/campaign';
import type { UserOrder, UserOrderItem, UserReturn } from '../types/order';

export type { Product, ProductReview } from '../types/product';
export type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from '../types/campaign';
export type { UserOrder, UserOrderItem, UserReturn } from '../types/order';

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; request_id?: string };
}

export class ApiError extends Error {
  code: string;
  requestId?: string;
  constructor(code: string, message: string, requestId?: string) {
    super(message);
    this.code = code;
    this.requestId = requestId;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin' });
  let payload: ApiEnvelope<T>;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('network_error', 'Invalid server response.');
  }
  if (!payload.ok || payload.data === undefined) {
    throw new ApiError(
      payload.error?.code ?? 'server_error',
      payload.error?.message ?? 'Request failed.',
      payload.error?.request_id
    );
  }
  return payload.data;
}







export interface CampaignData {
  heroSlides: HeroSlide[];
  promoBanners: PromoBanner[];
  featuredBlocks: FeaturedBlock[];
  lookbook: LookbookConfig | null;
}


export async function fetchProducts(filters: {
  category?: string;
  fabric?: string;
  offer?: string;
  q?: string;
  sort?: string;
} = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.fabric) params.set('fabric', filters.fabric);
  if (filters.offer) params.set('offer', filters.offer);
  if (filters.q) params.set('q', filters.q);
  if (filters.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  const data = await request<{ products: Product[] }>(`/api/products${qs ? '?' + qs : ''}`);
  return data.products ?? [];
}

export async function fetchProduct(slug: string): Promise<Product> {
  const data = await request<{ product: Product }>(`/api/product?slug=${encodeURIComponent(slug)}`);
  return data.product;
}

export async function fetchCampaign(): Promise<CampaignData> {
  return request<CampaignData>('/api/campaign');
}

export async function fetchReviews(productId: number): Promise<ProductReview[]> {
  const data = await request<{ reviews: ProductReview[] }>(`/api/reviews?product_id=${productId}`);
  return data.reviews ?? [];
}

export async function fetchAccountOrders(customerId = 1): Promise<{ orders: UserOrder[]; returns: UserReturn[] }> {
  const data = await request<{ orders: UserOrder[]; returns: UserReturn[] }>(
    `/api/account/orders?customer_id=${customerId}`
  );
  return { orders: data.orders ?? [], returns: data.returns ?? [] };
}
