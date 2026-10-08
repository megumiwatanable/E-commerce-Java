export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errorCode?: string;
  data?: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Cart {
  id: number;
  customerId: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  finalAmount: number;
  shippingAddress: string;
  paymentStatus: string;
  orderStatus: string;
  items?: OrderItem[];
  createdAt: string;
}

export interface Payment {
  id: number;
  paymentReference: string;
  orderId: number;
  customerId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionDate: string;
  failureReason?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  customerId: number;
  type: string;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}
