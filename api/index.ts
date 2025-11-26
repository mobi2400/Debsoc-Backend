import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { prisma } from '../src/lib/prisma.js';
import techHeadRoutes from '../src/routes/techHead.routes.js';
import presidentRoutes from '../src/routes/president.routes.js';
import cabinetRoutes from '../src/routes/cabinet.routes.js';
import memberRoutes from '../src/routes/member.routes.js';

dotenv.config();

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

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In development, allow all origins for easier testing
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                console.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('='.repeat(50));
    console.error('ERROR CAUGHT IN MIDDLEWARE');
    console.error('Error type:', typeof err);
    console.error('Error constructor:', err?.constructor?.name);
    console.error('Error name:', err?.name);
    console.error('Error message:', err?.message);
    console.error('Error stack:', err?.stack);
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
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({ 
        error: 'Internal server error',
        message: err?.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err?.stack,
            details: err
        })
    });
});

// Export the Express app for Vercel serverless
export default app;
