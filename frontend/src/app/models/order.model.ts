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
  availableQuantity?: number;
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK';
}

export interface Cart {
  id: number;
  customerId?: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  billingAddress?: string;
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
  customerId?: number;
  guestEmail?: string;
  guestPhone?: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  finalAmount: number;
  shippingAddress: string;
  billingAddress?: string;
  paymentStatus: string;
  orderStatus: string;
  items?: OrderItem[];
  createdAt: string;
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PlaceOrderRequest {
  idempotencyKey: string;
  email: string;
  phone: string;
  shippingAddress: CheckoutAddress;
  billingAddress: CheckoutAddress;
  paymentMethod: string;
  items: { productId: number; quantity: number }[];
}

export interface PlaceOrderResult {
  order: Order;
  guestOrderToken?: string;
  paymentReference?: string;
}

export interface Payment {
  id: number;
  paymentReference: string;
  orderId: number;
  customerId?: number;
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
