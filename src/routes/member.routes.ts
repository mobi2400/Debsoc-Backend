import { Router } from 'express';
import {
    registerMember,
    loginMember,
    getMyAttendance,
    getAssignedTasks,
    giveAnonymousMessageToPresident,
    getMyFeedback,
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

export default router;
