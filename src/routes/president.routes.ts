import { Router } from 'express';
import {
    registerPresident,
    loginPresident,
    assignTask,
    giveAnonymousFeedback,
    getSessionReports,
    getDashboardData,
    getAttendanceReport,
    getAnonymousMessages,
    getSentFeedback,
} from '../controllers/president.controller.js';
import { authMiddleware, authorizeRoles, requireVerification } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerPresident);
router.post('/login', loginPresident);

// Protected routes - President only (requires verification)
router.post('/tasks/assign', authMiddleware, authorizeRoles(['President']), requireVerification, assignTask);
router.post('/feedback/give', authMiddleware, authorizeRoles(['President']), requireVerification, giveAnonymousFeedback);
router.get('/sessions', authMiddleware, authorizeRoles(['President']), requireVerification, getSessionReports);
router.get('/dashboard', authMiddleware, authorizeRoles(['President']), requireVerification, getDashboardData);
router.get('/attendance-report', authMiddleware, authorizeRoles(['President']), requireVerification, getAttendanceReport);
router.get('/messages', authMiddleware, authorizeRoles(['President']), requireVerification, getAnonymousMessages);
router.get('/feedback/sent', authMiddleware, authorizeRoles(['President']), requireVerification, getSentFeedback);

export default router;
