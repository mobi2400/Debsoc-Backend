import { Router } from 'express';
import {
    registerMember,
    loginMember,
    getMyAttendance,
    getAssignedTasks,
    giveAnonymousMessageToPresident,
    getMyFeedback,
    getSentMessages,
    getPresidents,
} from '../controllers/member.controller.js';
import { authMiddleware, authorizeRoles, requireVerification } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerMember);
router.post('/login', loginMember);

// Protected routes - Member only (requires verification)
router.get('/attendance', authMiddleware, authorizeRoles(['Member', 'President']), requireVerification, getMyAttendance);
router.get('/tasks', authMiddleware, authorizeRoles(['Member', 'President']), requireVerification, getAssignedTasks);
router.post('/messages/president', authMiddleware, authorizeRoles(['Member']), requireVerification, giveAnonymousMessageToPresident);
router.get('/feedback', authMiddleware, authorizeRoles(['Member', 'President']), requireVerification, getMyFeedback);
router.get('/messages/sent', authMiddleware, authorizeRoles(['Member']), requireVerification, getSentMessages);
router.get('/presidents', authMiddleware, authorizeRoles(['Member']), requireVerification, getPresidents);

export default router;
