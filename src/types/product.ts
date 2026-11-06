export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  inStock: boolean;
  offerType: string;
  fabric: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface ProductReview {
  id: number;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  location: string;
}
