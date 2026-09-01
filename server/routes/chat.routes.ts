import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// GET /api/chat/global (Fetch last 50 historical global messages)
router.get('/global', (req, res) => chatController.getGlobalHistoryExpress(req, res));

// POST /api/chat/global (Save new global message)
router.post('/global', (req, res) => chatController.saveGlobalMessageExpress(req, res));

export default router;
