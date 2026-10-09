export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errorCode?: string;
  data?: T;
  timestamp: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  categoryIds: number[];
  categoryNames: string[];
  brand: string;
  price: number;
  discountPercentage: number;
  finalPrice: number;
  imageUrl: string;
  rating: number;
  status: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
