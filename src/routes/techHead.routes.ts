import { Router } from 'express';
import {
  loginTechHead,
  verifyPresident,
  verifyCabinet,
  verifyMember,
  getUnverifiedUsers,
  unverifyPresident,
  unverifyCabinet,
  unverifyMember,
} from '../controllers/techHead.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', loginTechHead);

// Protected routes - TechHead only
router.post('/verify/president', authMiddleware, authorizeRoles(['TechHead']), verifyPresident);
router.post('/verify/cabinet', authMiddleware, authorizeRoles(['TechHead']), verifyCabinet);
router.post('/verify/member', authMiddleware, authorizeRoles(['TechHead']), verifyMember);
router.get('/unverified-users', authMiddleware, authorizeRoles(['TechHead']), getUnverifiedUsers);

router.post('/unverify/president', authMiddleware, authorizeRoles(['TechHead']), unverifyPresident);
router.post('/unverify/cabinet', authMiddleware, authorizeRoles(['TechHead']), unverifyCabinet);
router.post('/unverify/member', authMiddleware, authorizeRoles(['TechHead']), unverifyMember);

export default router;
