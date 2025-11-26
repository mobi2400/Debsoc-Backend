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

// CORS configuration - allows requests from any origin
app.use(cors({
    origin: '*', // In production, replace with specific domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Debsoc Backend API', version: '1.0.0' });
});

// API Routes
app.use('/api/techhead', techHeadRoutes);
app.use('/api/president', presidentRoutes);
app.use('/api/cabinet', cabinetRoutes);
app.use('/api/member', memberRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    console.error('Request path:', req.path);
    console.error('Request body:', req.body);
    
    // Return more detailed error in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(500).json({ 
        error: 'Internal server error',
        ...(isDevelopment && { 
            message: err.message,
            stack: err.stack 
        })
    });
});

// Export the Express app for Vercel serverless
export default app;
