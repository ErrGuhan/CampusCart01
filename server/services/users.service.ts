import { Injectable } from '@nestjs/common';

export interface BuyerDto {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  purchasedItemsCount: number;
  lastPurchaseDate: string;
}

@Injectable()
export class UsersService {
  /**
   * Fetches a distinct list of student buyers who have completed orders
   * for products belonging to the specified sellerId.
   */
  async getBuyersBySellerId(sellerId: string): Promise<BuyerDto[]> {
    // PostgreSQL Distinct Query (TypeORM / Prisma):
    // SELECT DISTINCT u.id, u.name, u.avatar, u.department, u.year, COUNT(o.id) as purchasedItemsCount, MAX(o.created_at) as lastPurchaseDate
    // FROM users u
    // JOIN orders o ON o.buyer_id = u.id
    // JOIN order_items oi ON oi.order_id = o.id
    // JOIN products p ON p.id = oi.product_id
    // WHERE p.seller_id = $1 AND o.status = 'DELIVERED'
    // GROUP BY u.id, u.name, u.avatar, u.department, u.year
    // ORDER BY lastPurchaseDate DESC;

    return [
      {
        id: 'user_rahul',
        name: 'Rahul Sharma',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        department: 'CSE',
        year: '3rd Year',
        purchasedItemsCount: 2,
        lastPurchaseDate: new Date().toISOString(),
      },
      {
        id: 'user_priya',
        name: 'Priya Patel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        department: 'ECE',
        year: '4th Year',
        purchasedItemsCount: 1,
        lastPurchaseDate: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'user_ananya',
        name: 'Ananya Verma',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        department: 'Mechanical',
        year: '2nd Year',
        purchasedItemsCount: 3,
        lastPurchaseDate: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'user_karthik',
        name: 'Karthik Raja',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
        department: 'EEE',
        year: '4th Year',
        purchasedItemsCount: 1,
        lastPurchaseDate: new Date(Date.now() - 259200000).toISOString(),
      },
    ];
  }
}

export const usersService = new UsersService();
