import express, {type Request, type Response, type NextFunction} from 'express';
import dotenv from 'dotenv';
import {prisma} from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({message: 'Debsoc Backend API', version: '1.0.0'});
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({error: 'Internal server error'});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
