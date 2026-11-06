import type { UserOrder, UserReturn } from '../types/order';

export const SAMPLE_USER_ORDERS: UserOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'SAR-2026-98421',
    date: '29 Oct 2026',
    totalAmount: 4899,
    status: 'In Transit',
    trackingNumber: 'DELHIVERY-77291034',
    carrier: 'Delhivery Express',
    estimatedDelivery: 'Estimated 2-3 Business Days',
    canReturn: false,
    items: [
      {
        name: 'Maroon Banarasi Silk Saree',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        size: 'Free Size (0.8m Blouse Piece)',
        color: 'Maroon',
        price: 4899,
        quantity: 1
      }
    ]
  },
  {
    id: 'ord-2',
    orderNumber: 'SAR-2026-87102',
    date: '14 Oct 2026',
    totalAmount: 5598,
    status: 'Delivered',
    trackingNumber: 'BLUEDART-88931201',
    carrier: 'Blue Dart Luxury Logistics',
    deliveredDate: '18 Oct 2026',
    canReturn: true,
    items: [
      {
        name: 'Emerald Green Georgette Anarkali',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
        size: 'M (38)',
        color: 'Emerald Green',
        price: 3499,
        quantity: 1
      },
      {
        name: 'White Chikankari Kurti',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        size: 'M (38)',
        color: 'Ivory White',
        price: 2099,
        quantity: 1
      }
    ]
  },
  {
    id: 'ord-3',
    orderNumber: 'SAR-2026-65490',
    date: '22 Sep 2026',
    totalAmount: 6499,
    status: 'Delivered',
    trackingNumber: 'EKART-33920194',
    carrier: 'Ekart Logistics',
    deliveredDate: '26 Sep 2026',
    canReturn: false,
    items: [
      {
        name: 'Royal Blue Kanjivaram Silk Saree',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        size: 'Free Size (0.8m Blouse Piece)',
        color: 'Royal Blue',
        price: 6499,
        quantity: 1
      }
    ]
  }
];

export const SAMPLE_USER_RETURNS: UserReturn[] = [
  {
    id: 'ret-1',
    returnNumber: 'RET-2026-1049',
    orderNumber: 'SAR-2026-78210',
    date: '25 Oct 2026',
    status: 'Initiated Return',
    type: 'Exchange',
    reason: 'Size Exchange (exchanging Size L for Size M)',
    refundNote: 'Return initiated by user. Please securely package the ensemble with tags attached and courier to our Bengaluru Return Warehouse.',
    item: {
      name: 'Rose Pink Embroidered Lehenga',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      size: 'L (40)',
      color: 'Rose Pink',
      price: 7999
    }
  },
  {
    id: 'ret-2',
    returnNumber: 'RET-2026-0831',
    orderNumber: 'SAR-2026-55109',
    date: '04 Oct 2026',
    status: 'Refund Processed',
    type: 'Return',
    reason: 'Color tone mismatch with festive celebration theme',
    refundAmount: 2499,
    refundNote: 'Full refund of ₹2,499 processed to original payment method (HDFC Bank ending •••• 8821). Reference: ARN-8830192.',
    item: {
      name: 'Mustard Silk Blend Kurti Set',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      size: 'M (38)',
      color: 'Mustard Yellow',
      price: 2499
    }
  }
];
