export interface UserOrderItem {
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  date: string;
  totalAmount: number;
  status: 'In Transit' | 'Delivered' | 'Confirmed';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  canReturn: boolean;
  items: UserOrderItem[];
}

export interface UserReturn {
  id: string;
  returnNumber: string;
  orderNumber: string;
  date: string;
  status: 'Initiated Return' | 'In Inspection' | 'Refund Processed';
  type: 'Exchange' | 'Return';
  reason: string;
  refundAmount?: number;
  refundNote: string;
  item: {
    name: string;
    image: string;
    size: string;
    color: string;
    price: number;
  };
}
