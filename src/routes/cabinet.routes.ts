import { Router } from 'express';
import {
    registerCabinet,
    loginCabinet,
    createSession,
    markAttendance,
    getAssignedTasks,
    giveAnonymousFeedback,
    getSessionReports,
    giveAnonymousMessageToPresident,
    getDashboardData,
    getSentMessages,
    getSentFeedback,
    getMyAttendance,
} from '../controllers/cabinet.controller.js';
import { authMiddleware, authorizeRoles, requireVerification } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerCabinet);
router.post('/login', loginCabinet);

// Protected routes - Cabinet only (requires verification)
router.post('/session/create', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, createSession);
router.post('/attendance/mark', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, markAttendance);
router.get('/tasks', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, getAssignedTasks);
router.post('/feedback/give', authMiddleware, authorizeRoles(['cabinet']), requireVerification, giveAnonymousFeedback);
router.get('/sessions', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, getSessionReports);
router.post('/messages/president', authMiddleware, authorizeRoles(['cabinet']), requireVerification, giveAnonymousMessageToPresident);
router.get('/dashboard', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, getDashboardData);
router.get('/messages/sent', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, getSentMessages);
router.get('/feedback/sent', authMiddleware, authorizeRoles(['cabinet', 'President']), requireVerification, getSentFeedback);
router.get('/attendance/my', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getMyAttendance);

export default router;
