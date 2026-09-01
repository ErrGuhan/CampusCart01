import { Controller, Get, Post, Body, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatService, chatService } from '../services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService = chatService) {}

  /**
   * NestJS Endpoint: GET /chat/global
   */
  @Get('global')
  async getGlobalHistoryNest(@Query('limit') limit?: number) {
    const messages = await this.service.getGlobalMessagesHistory(limit ? Number(limit) : 50);
    return {
      status: 'success',
      count: messages.length,
      messages,
    };
  }

  /**
   * Express Handler: GET /api/chat/global
   */
  async getGlobalHistoryExpress(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const messages = await this.service.getGlobalMessagesHistory(limit);
      res.status(200).json({
        success: true,
        count: messages.length,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch global chat history',
      });
    }
  }

  /**
   * Express Handler: POST /api/chat/global
   */
  async saveGlobalMessageExpress(req: Request, res: Response) {
    try {
      const { senderId, senderName, senderAvatar, content, productContext } = req.body;
      if (!senderId || !content) {
        res.status(400).json({ success: false, error: 'senderId and content are required' });
        return;
      }
      const message = await this.service.saveGlobalMessage({
        senderId,
        senderName,
        senderAvatar,
        content,
        productContext,
      });
      res.status(201).json({
        success: true,
        message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to save global message',
      });
    }
  }
}

export const chatController = new ChatController();
