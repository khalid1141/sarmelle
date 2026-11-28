/**
 * MOCK ONLY - remove
 * Initial mock data for inventory, products, summary, and history.
 */
import { Product, InventorySummary, VariantHistoryItem } from '../types';

export const MOCK_ADMIN_NAME = 'Aarav Sharma';
export const MOCK_ADMIN_EMAIL = 'owner@example.com';
export const MOCK_ADMIN_PASSWORD = 'MockPassword123!';
export const MOCK_OTP_CODE = '123456';

export const MOCK_SUMMARY: InventorySummary = {
  this_month_orders: 1428,
  this_month_sales: 38495000, // ₹3,84,950.00 in paise
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Classic Linen Oversized Shirt',
    category: 'Apparel',
    status: 'Active',
    image_placeholder_color: 'bg-stone-200',
    held_units: 2,
    variants: [
      { id: 'v-101', color: 'Cream', color_hex: '#f5f5dc', size: 'S', available_quantity: 15, sku: 'CLS-CRM-S' },
      { id: 'v-102', color: 'Cream', color_hex: '#f5f5dc', size: 'M', available_quantity: 24, sku: 'CLS-CRM-M' },
      { id: 'v-103', color: 'Cream', color_hex: '#f5f5dc', size: 'L', available_quantity: 8, sku: 'CLS-CRM-L' },
      { id: 'v-104', color: 'Deep Maroon', color_hex: '#800000', size: 'M', available_quantity: 12, sku: 'CLS-MAR-M' },
      { id: 'v-105', color: 'Deep Maroon', color_hex: '#800000', size: 'XL', available_quantity: 5, sku: 'CLS-MAR-XL' },
    ],
  },
  {
    id: 'prod-2',
    name: 'Structured Cotton Pleated Trousers',
    category: 'Apparel',
    status: 'Active',
    image_placeholder_color: 'bg-amber-100',
    held_units: 0,
    variants: [
      { id: 'v-201', color: 'Black', color_hex: '#111111', size: 'M', available_quantity: 30, sku: 'SPT-BLK-M' },
      { id: 'v-202', color: 'Black', color_hex: '#111111', size: 'L', available_quantity: 18, sku: 'SPT-BLK-L' },
      { id: 'v-203', color: 'Gold', color_hex: '#d4af37', size: 'S', available_quantity: 9, sku: 'SPT-GLD-S' },
      { id: 'v-204', color: 'Gold', color_hex: '#d4af37', size: 'M', available_quantity: 14, sku: 'SPT-GLD-M' },
    ],
  },
  {
    id: 'prod-3',
    name: 'Minimalist Handcrafted Ceramic Vase',
    category: 'Home & Living',
    status: 'Active',
    image_placeholder_color: 'bg-stone-300',
    held_units: 1,
    variants: [
      { id: 'v-301', color: 'Cream', color_hex: '#f5f5dc', size: 'Free size', available_quantity: 22, sku: 'MHC-CRM-FREE' },
      { id: 'v-302', color: 'Black', color_hex: '#111111', size: 'Free size', available_quantity: 7, sku: 'MHC-BLK-FREE' },
    ],
  },
  {
    id: 'prod-4',
    name: 'Pure Brass Aromatherapy Burner',
    category: 'Home & Living',
    status: 'Active',
    image_placeholder_color: 'bg-amber-200',
    held_units: 0,
    variants: [
      { id: 'v-401', color: 'Gold', color_hex: '#d4af37', size: 'Free size', available_quantity: 45, sku: 'PBA-GLD-FREE' },
    ],
  },
  {
    id: 'prod-5',
    name: 'Structured Canvas Daily Tote',
    category: 'Accessories',
    status: 'Active',
    image_placeholder_color: 'bg-stone-200',
    held_units: 3,
    variants: [
      { id: 'v-501', color: 'Cream', color_hex: '#f5f5dc', size: 'Free size', available_quantity: 50, sku: 'SCD-CRM-FREE' },
      { id: 'v-502', color: 'Black', color_hex: '#111111', size: 'Free size', available_quantity: 35, sku: 'SCD-BLK-FREE' },
      { id: 'v-503', color: 'Deep Maroon', color_hex: '#800000', size: 'Free size', available_quantity: 19, sku: 'SCD-MAR-FREE' },
    ],
  },
  {
    id: 'prod-6',
    name: 'Handwoven Artisan Throw Blanket',
    category: 'Home & Living',
    status: 'Draft',
    image_placeholder_color: 'bg-amber-100',
    held_units: 0,
    variants: [
      { id: 'v-601', color: 'Cream', color_hex: '#f5f5dc', size: 'Free size', available_quantity: 10, sku: 'HAT-CRM-FREE' },
      { id: 'v-602', color: 'Gold', color_hex: '#d4af37', size: 'Free size', available_quantity: 6, sku: 'HAT-GLD-FREE' },
    ],
  },
  {
    id: 'prod-7',
    name: 'Brushed Brass Table Lamp',
    category: 'Home & Living',
    status: 'Active',
    image_placeholder_color: 'bg-stone-300',
    held_units: 0,
    variants: [
      { id: 'v-701', color: 'Gold', color_hex: '#d4af37', size: 'Free size', available_quantity: 11, sku: 'BBL-GLD-FREE' },
      { id: 'v-702', color: 'Black', color_hex: '#111111', size: 'Free size', available_quantity: 8, sku: 'BBL-BLK-FREE' },
    ],
  },
  {
    id: 'prod-8',
    name: 'Signature Leather Journal',
    category: 'Accessories',
    status: 'Archived',
    image_placeholder_color: 'bg-stone-400',
    held_units: 0,
    variants: [
      { id: 'v-801', color: 'Deep Maroon', color_hex: '#800000', size: 'Free size', available_quantity: 0, sku: 'SLJ-MAR-FREE' },
      { id: 'v-802', color: 'Black', color_hex: '#111111', size: 'Free size', available_quantity: 3, sku: 'SLJ-BLK-FREE' },
    ],
  },
];

export const INITIAL_HISTORY: Record<string, VariantHistoryItem[]> = {
  'v-101': [
    {
      id: 'h-1',
      variant_id: 'v-101',
      admin_name: 'Aarav Sharma',
      timestamp: '2026-11-18T14:30:00Z',
      old_quantity: 18,
      new_quantity: 15,
      reason: 'Physical store stock recount / adjustment',
    },
    {
      id: 'h-2',
      variant_id: 'v-101',
      admin_name: 'Aarav Sharma',
      timestamp: '2026-11-10T09:15:00Z',
      old_quantity: 20,
      new_quantity: 18,
      reason: 'Damaged item written off',
    },
  ],
  'v-201': [
    {
      id: 'h-3',
      variant_id: 'v-201',
      admin_name: 'Aarav Sharma',
      timestamp: '2026-11-15T11:20:00Z',
      old_quantity: 25,
      new_quantity: 30,
      reason: 'New shipment received from warehouse',
    },
  ],
};
