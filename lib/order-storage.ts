export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  sellerName: string;
  sellerUsername: string;
  isDigital?: boolean;
  digitalFileUrl?: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: 'pickup' | 'delivery';
  pickupPoint: string | null;
  pickupPin?: string;
  notes: string | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
};

export const CAMPUS_PICKUP_POINTS = [
  'Central Library Entrance',
  'Main Canteen / Food Court',
  'CSE & Tech Park Block (Ground Floor)',
  'Mechanical / Civil Block Courtyard',
  'ECE & EEE Laboratory Block',
  'Boys Hostel (Block A/B Gate)',
  'Girls Hostel Entrance Security Desk',
  'College Main Gate / Security Arch',
  'Admin Block Reception Desk',
];

const STORAGE_KEY = 'campuscart-orders';

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'CC-SVCET-1082',
    status: 'ready_for_pickup',
    fulfillmentType: 'pickup',
    pickupPoint: 'Central Library Entrance',
    pickupPin: '4821',
    paymentStatus: 'paid',
    paymentMethod: 'UPI (QR Code)',
    transactionId: 'TXN984201948210',
    subtotal: 979,
    discount: 0,
    deliveryFee: 0,
    total: 979,
    notes: 'Please meet around 4:30 PM near the library lawn.',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        slug: 'handmade-engineering-drawing-board-cover',
        name: 'Handmade Engineering Drawing Board Cover & Strap',
        image: 'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        price: 350,
        discountPrice: 280,
        quantity: 1,
        sellerName: 'Guhan M',
        sellerUsername: 'guhan',
        isDigital: false,
      },
      {
        id: 'item-2',
        productId: 'prod-4',
        slug: 'arduino-iot-smart-home-starter-kit-with-sensors',
        name: 'Arduino IoT Smart Home Starter Kit with 12 Sensors',
        image: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        price: 850,
        discountPrice: 699,
        quantity: 1,
        sellerName: 'Guhan M',
        sellerUsername: 'guhan',
        isDigital: false,
      },
    ],
  },
  {
    id: 'CC-SVCET-1079',
    status: 'delivered',
    fulfillmentType: 'pickup',
    pickupPoint: 'CSE & Tech Park Block (Ground Floor)',
    pickupPin: '7193',
    paymentStatus: 'paid',
    paymentMethod: 'UPI (QR Code)',
    transactionId: 'TXN827491028371',
    subtotal: 698,
    discount: 0,
    deliveryFee: 0,
    total: 698,
    notes: 'Completed delivery at lab.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item-3',
        productId: 'prod-5',
        slug: 'full-stack-mern-ecommerce-final-year-project-code',
        name: 'Full-Stack MERN E-Commerce Final Year Project Source Code',
        image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        price: 499,
        discountPrice: 349,
        quantity: 2,
        sellerName: 'Guhan M',
        sellerUsername: 'guhan',
        isDigital: true,
        digitalFileUrl: 'https://github.com/campuscart-project-source-code',
      },
    ],
  },
  {
    id: 'CC-SVCET-1075',
    status: 'delivered',
    fulfillmentType: 'pickup',
    pickupPoint: 'Main Canteen / Food Court',
    pickupPin: '9012',
    paymentStatus: 'paid',
    paymentMethod: 'UPI (GPay)',
    transactionId: 'TXN716294019284',
    subtotal: 560,
    discount: 0,
    deliveryFee: 0,
    total: 560,
    notes: '',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item-4',
        productId: 'prod-1',
        slug: 'handmade-engineering-drawing-board-cover',
        name: 'Handmade Engineering Drawing Board Cover & Strap',
        image: 'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        price: 350,
        discountPrice: 280,
        quantity: 2,
        sellerName: 'Guhan M',
        sellerUsername: 'guhan',
        isDigital: false,
      },
    ],
  },
];

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(stored) as Order[];
    return parsed.length > 0 ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campuscart_order_updated'));
    }
  } catch {}
}

export function updateOrderStatus(orderId: string, status: OrderStatus): boolean {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;
  orders[idx].status = status;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campuscart_order_updated'));
    }
  } catch {}
  return true;
}

export function verifyOrderPickupPin(orderId: string, inputPin: string): { success: boolean; message: string } {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return { success: false, message: 'Order not found' };

  const order = orders[idx];
  if (!order.pickupPin || order.pickupPin.trim() === inputPin.trim()) {
    orders[idx].status = 'delivered';
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campuscart_order_updated'));
      }
    } catch {}
    return { success: true, message: 'Handover PIN verified! Order marked as Delivered.' };
  }
  return { success: false, message: 'Invalid PIN. Please check the 4-digit code with the buyer.' };
}

export function generatePickupPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CC-${timestamp}-${random}`;
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `TXN${timestamp}${random}`;
}

export const statusLabels: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Payment Done',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const statusColors: Record<OrderStatus, string> = {
  pending_payment: 'bg-warning/10 text-warning',
  paid: 'bg-primary/10 text-primary',
  confirmed: 'bg-primary/10 text-primary',
  processing: 'bg-primary/10 text-primary',
  ready_for_pickup: 'bg-success/10 text-success',
  out_for_delivery: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
};
