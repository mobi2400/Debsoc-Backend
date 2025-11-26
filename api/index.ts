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

// CORS configuration - allow requests from frontend domain
const allowedOrigins = [
    'https://www.smvitdebsoc.com',
    'https://smvitdebsoc.com',
    'http://localhost:3000',
    'http://localhost:3001',
    // Allow from environment variable if set
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// Helper function to check if origin is allowed
const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true; // Allow requests with no origin
    if (allowedOrigins.includes(origin)) return true;
    if (process.env.NODE_ENV === 'development') return true; // Allow all in development
    return false;
};

// Manual CORS headers middleware - must be before other middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    // Log CORS-related information for debugging
    if (req.method === 'OPTIONS' || origin) {
        console.log(`CORS: ${req.method} ${req.path} from origin: ${origin || 'none'}`);
    }
    
    if (isOriginAllowed(origin)) {
        // If origin exists and is allowed, use it
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else if (process.env.NODE_ENV === 'development') {
            // In development, allow all origins
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        
        console.log(`CORS headers set for origin: ${origin || 'none'}`);
    } else {
        console.warn(`CORS: Origin not allowed: ${origin}`);
    }
    
    // Handle preflight OPTIONS requests - MUST return before other middleware
    if (req.method === 'OPTIONS') {
        console.log('CORS: Handling OPTIONS preflight request');
        return res.status(204).end();
    }
    
    next();
});

// Also use cors middleware as backup
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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
