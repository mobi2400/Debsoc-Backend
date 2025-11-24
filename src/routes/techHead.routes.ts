import {Router} from 'express';
import {
  registerTechHead,
  loginTechHead,
  verifyPresident,
  verifyCabinet,
  verifyMember,
  getUnverifiedUsers,
} from '../controllers/techHead.controller.js';
import {authMiddleware, authorizeRoles} from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerTechHead);
router.post('/login', loginTechHead);

// Protected routes - TechHead only
router.post('/verify/president', authMiddleware, authorizeRoles(['TechHead']), verifyPresident);
router.post('/verify/cabinet', authMiddleware, authorizeRoles(['TechHead']), verifyCabinet);
router.post('/verify/member', authMiddleware, authorizeRoles(['TechHead']), verifyMember);
router.get('/unverified-users', authMiddleware, authorizeRoles(['TechHead']), getUnverifiedUsers);

export default router;
