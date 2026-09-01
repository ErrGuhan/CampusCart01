import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService, usersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  /**
   * NestJS Endpoint: GET /users/:sellerId/buyers
   */
  @Get(':sellerId/buyers')
  async getBuyersBySellerIdNest(
    @Param('sellerId') sellerId: string
  ) {
    const buyers = await this.service.getBuyersBySellerId(sellerId);
    return {
      status: 'success',
      count: buyers.length,
      buyers,
    };
  }

  /**
   * Express Handler: GET /api/users/:sellerId/buyers
   */
  async getBuyersExpress(req: Request, res: Response) {
    try {
      const sellerId = Array.isArray(req.params.sellerId) ? req.params.sellerId[0] : (req.params.sellerId || '');
      const buyers = await this.service.getBuyersBySellerId(sellerId);
      res.status(200).json({
        success: true,
        count: buyers.length,
        buyers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch seller buyers',
      });
    }
  }
}

export const usersController = new UsersController();
