import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protected route - Accessible by Member, Cabinet, President, and TechHead
router.get('/', authMiddleware, authorizeRoles(['Member', 'cabinet', 'President', 'TechHead']), getLeaderboard);

export default router;
