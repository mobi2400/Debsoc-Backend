import express, {} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { prisma } from '../src/lib/prisma.js';
import techHeadRoutes from '../src/routes/techHead.routes.js';
import presidentRoutes from '../src/routes/president.routes.js';
import cabinetRoutes from '../src/routes/cabinet.routes.js';
import memberRoutes from '../src/routes/member.routes.js';
dotenv.config();
const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.get('/', (req, res) => {
    res.json({ message: 'Debsoc Backend API', version: '1.0.0' });
});
app.use('/api/techhead', techHeadRoutes);
app.use('/api/president', presidentRoutes);
app.use('/api/cabinet', cabinetRoutes);
app.use('/api/member', memberRoutes);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
export default app;
