import { Router } from 'express';
import { usersController } from '../controllers/users.controller';

const router = Router();

// GET /api/users/:sellerId/buyers
router.get('/:sellerId/buyers', (req, res) => usersController.getBuyersExpress(req, res));

export default router;
