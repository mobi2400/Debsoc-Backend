import { Router } from 'express';
import {
    registerCabinet,
    loginCabinet,
    markAttendance,
    getAssignedTasks,
    giveAnonymousFeedback,
    getSessionReports,
    giveAnonymousMessageToPresident,
    getDashboardData,
    getSentMessages,
    getSentFeedback,
} from '../controllers/cabinet.controller.js';
import { authMiddleware, authorizeRoles, requireVerification } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerCabinet);
router.post('/login', loginCabinet);

// Protected routes - Cabinet only (requires verification)
router.post('/attendance/mark', authMiddleware, authorizeRoles(['cabinet']), requireVerification, markAttendance);
router.get('/tasks', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getAssignedTasks);
router.post('/feedback/give', authMiddleware, authorizeRoles(['cabinet']), requireVerification, giveAnonymousFeedback);
router.get('/sessions', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getSessionReports);
router.post('/messages/president', authMiddleware, authorizeRoles(['cabinet']), requireVerification, giveAnonymousMessageToPresident);
router.get('/dashboard', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getDashboardData);
router.get('/messages/sent', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getSentMessages);
router.get('/feedback/sent', authMiddleware, authorizeRoles(['cabinet']), requireVerification, getSentFeedback);

export default router;
