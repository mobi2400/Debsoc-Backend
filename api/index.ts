import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { prisma } from '../src/lib/prisma.js';
import techHeadRoutes from '../src/routes/techHead.routes.js';
import presidentRoutes from '../src/routes/president.routes.js';
import cabinetRoutes from '../src/routes/cabinet.routes.js';
import memberRoutes from '../src/routes/member.routes.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please set these variables in your .env file or environment configuration.');
    process.exit(1);
}

// Validate JWT_SECRET strength (should be at least 32 characters)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security.');
}

const app = express();

// CORS configuration - allows requests from any origin with credentials
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow any origin
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Explicitly handle OPTIONS requests
app.options('*', cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true
}));

// Increase JSON payload limit for larger requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body keys:', Object.keys(req.body));
    }
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Debsoc Backend API', version: '1.0.0' });
});

// API Routes
app.use('/api/techhead', techHeadRoutes);
app.use('/api/president', presidentRoutes);
app.use('/api/cabinet', cabinetRoutes);
app.use('/api/member', memberRoutes);

// Error handling middleware - must be last
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error('='.repeat(50));
    console.error('ERROR CAUGHT IN MIDDLEWARE');
    console.error('Error type:', typeof err);

    // Type guard for error objects
    interface ErrorWithStatus {
        statusCode?: number;
        status?: number;
        message?: string;
        stack?: string;
        constructor?: { name?: string };
    }

    const error = err as ErrorWithStatus & Error;

    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Request method:', req.method);
    console.error('Request path:', req.path);
    console.error('Request URL:', req.url);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('='.repeat(50));

    // Don't send response if headers already sent
    if (res.headersSent) {
        return next(err);
    }

    // Return detailed error (even in production for now to help debug)
    const statusCode = error?.statusCode || error?.status || 500;
    res.status(statusCode).json({
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV !== 'production' && {
            stack: error?.stack,
            details: err
        })
    });
});

// Export the Express app for Vercel serverless
export default app;
