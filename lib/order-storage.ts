import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, onSnapshot } from 'firebase/firestore';

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
  sellerId?: string;
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
  buyerId?: string;
  buyerEmail?: string;
  buyerName?: string;
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

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Order[]) : [];
  } catch {
    return [];
  }
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export async function fetchOrdersFromFirestore(): Promise<Order[]> {
  const local = getOrders();
  const orderMap = new Map<string, Order>();
  local.forEach((o) => orderMap.set(o.id, o));

  try {
    const snap = await getDocs(collection(db, 'orders'));
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data();
        const ord: Order = {
          id: d.id,
          status: data.status || 'confirmed',
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          deliveryFee: Number(data.deliveryFee ?? data.delivery_fee) || 0,
          total: Number(data.total) || 0,
          fulfillmentType: data.fulfillmentType || data.fulfillment_type || 'pickup',
          pickupPoint: data.pickupPoint || data.pickup_point || null,
          pickupPin: data.pickupPin || data.pickup_pin,
          notes: data.notes || null,
          paymentStatus: data.paymentStatus || data.payment_status || 'paid',
          paymentMethod: data.paymentMethod || data.payment_method || 'UPI',
          transactionId: data.transactionId || data.transaction_id || '',
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          buyerId: data.buyerId || data.buyer_id,
          buyerEmail: data.buyerEmail || data.buyer_email,
          buyerName: data.buyerName || data.buyer_name,
        };
        orderMap.set(d.id, ord);
      });
    }
  } catch (err) {
    console.warn('Firestore fetchOrders notice:', err);
  }

  const allOrders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allOrders));
    } catch {}
  }

  return allOrders;
}

export function subscribeToOrders(onUpdate: (orders: Order[]) => void): () => void {
  // 1. Send initial cached data immediately
  onUpdate(getOrders());

  // 2. Fetch fresh from Firestore
  fetchOrdersFromFirestore().then(onUpdate).catch(() => {});

  // 3. Real-time Firestore snapshot listener
  let unsubscribeFirestore = () => {};
  try {
    unsubscribeFirestore = onSnapshot(collection(db, 'orders'), (snap) => {
      const orderMap = new Map<string, Order>();
      getOrders().forEach((o) => orderMap.set(o.id, o));

      snap.forEach((d) => {
        const data = d.data();
        const ord: Order = {
          id: d.id,
          status: data.status || 'confirmed',
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          deliveryFee: Number(data.deliveryFee ?? data.delivery_fee) || 0,
          total: Number(data.total) || 0,
          fulfillmentType: data.fulfillmentType || data.fulfillment_type || 'pickup',
          pickupPoint: data.pickupPoint || data.pickup_point || null,
          pickupPin: data.pickupPin || data.pickup_pin,
          notes: data.notes || null,
          paymentStatus: data.paymentStatus || data.payment_status || 'paid',
          paymentMethod: data.paymentMethod || data.payment_method || 'UPI',
          transactionId: data.transactionId || data.transaction_id || '',
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          buyerId: data.buyerId || data.buyer_id,
          buyerEmail: data.buyerEmail || data.buyer_email,
          buyerName: data.buyerName || data.buyer_name,
        };
        orderMap.set(d.id, ord);
      });

      const updated = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }

      onUpdate(updated);
    });
  } catch (err) {
    console.warn('Real-time order snapshot notice:', err);
  }

  // 4. Local browser event listener
  const handleLocalUpdate = () => {
    onUpdate(getOrders());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('campuscart_order_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('focus', handleLocalUpdate);
  }

  return () => {
    unsubscribeFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('campuscart_order_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('focus', handleLocalUpdate);
    }
  };
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  const existingIndex = orders.findIndex((o) => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campuscart_order_updated'));
    }
  } catch {}

  // Sync to Firestore
  try {
    setDoc(doc(db, 'orders', order.id), {
      ...order,
      buyer_id: order.buyerId || 'guest',
      buyer_email: order.buyerEmail || '',
      buyer_name: order.buyerName || 'Student',
      created_at: order.createdAt || new Date().toISOString(),
    }, { merge: true }).catch((e) => console.warn('Firestore saveOrder notice:', e));
  } catch (e) {
    console.warn('Firestore saveOrder sync error:', e);
  }
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

  try {
    setDoc(doc(db, 'orders', orderId), { status }, { merge: true }).catch(() => {});
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

    try {
      setDoc(doc(db, 'orders', orderId), { status: 'delivered' }, { merge: true }).catch(() => {});
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
  return `CC-SVCET-${timestamp}-${random}`;
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
