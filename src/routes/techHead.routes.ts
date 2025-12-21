import { Router } from 'express';
import {
  loginTechHead,
  verifyPresident,
  verifyCabinet,
  verifyMember,
  getUnverifiedUsers,
  getVerifiedUsers,
  unverifyPresident,
  unverifyCabinet,
  unverifyMember,
  deletePresident,
  deleteCabinet,
  deleteMember,
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
router.get('/verified-users', authMiddleware, authorizeRoles(['TechHead']), getVerifiedUsers);

router.post('/unverify/president', authMiddleware, authorizeRoles(['TechHead']), unverifyPresident);
router.post('/unverify/cabinet', authMiddleware, authorizeRoles(['TechHead']), unverifyCabinet);
router.post('/unverify/member', authMiddleware, authorizeRoles(['TechHead']), unverifyMember);

router.delete('/delete/president', authMiddleware, authorizeRoles(['TechHead']), deletePresident);
router.delete('/delete/cabinet', authMiddleware, authorizeRoles(['TechHead']), deleteCabinet);
router.delete('/delete/member', authMiddleware, authorizeRoles(['TechHead']), deleteMember);

export default router;
