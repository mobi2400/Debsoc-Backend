import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register President
export const registerPresident = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const existingPresident = await prisma.president.findUnique({
            where: { email },
        });

        if (existingPresident) {
            return res.status(400).json({ message: 'President already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const president = await prisma.president.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ id: president.id, email: president.email, role: 'President', isVerified: president.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(201).json({
            message: 'President registered successfully',
            token,
            user: { id: president.id, name: president.name, email: president.email, role: 'President', isVerified: president.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Login President
export const loginPresident = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const president = await prisma.president.findUnique({
            where: { email },
        });

        if (!president) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, president.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: president.id, email: president.email, role: 'President', isVerified: president.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: president.id, name: president.name, email: president.email, role: 'President', isVerified: president.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Assign Task to Cabinet or Member
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, deadline, assignedToId, assignedToMemberId } = req.body;

        if (!name || !description || !deadline) {
            return res.status(400).json({ message: 'Please provide name, description, and deadline' });
        }

        if (!assignedToId && !assignedToMemberId) {
            return res.status(400).json({ message: 'Please assign task to either a cabinet member or a member' });
        }

        const task = await prisma.task.create({
            data: {
                name,
                description,
                deadline: new Date(deadline),
                assignedToId: assignedToId || null,
                assignedToMemberId: assignedToMemberId || null,
            },
        });

        res.status(201).json({
            message: 'Task assigned successfully',
            task,
        });
    } catch (error) {
        next(error);
    }
};

// Give Anonymous Feedback to Member
export const giveAnonymousFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { feedback, memberId } = req.body;
        const senderPresidentId = req.user?.id;

        if (!senderPresidentId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!feedback || !memberId) {
            return res.status(400).json({ message: 'Please provide feedback and memberId' });
        }

        const anonymousFeedback = await prisma.anonymousFeedback.create({
            data: {
                feedback,
                memberId,
                senderType: 'President',
                senderPresidentId,
            },
        });

        res.status(201).json({
            message: 'Anonymous feedback sent successfully',
            feedback: anonymousFeedback,
        });
    } catch (error) {
        next(error);
    }
};

// Get Session Reports
export const getSessionReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: { sessionDate: 'desc' },
        });

        res.status(200).json({ sessions });
    } catch (error) {
        next(error);
    }
};

// Get Dashboard Data (Members and Cabinet)
export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await prisma.member.findMany({
            select: { id: true, name: true, email: true, isVerified: true },
        });

        const cabinet = await prisma.cabinet.findMany({
            select: { id: true, name: true, email: true, position: true, isVerified: true },
        });

        res.status(200).json({
            members,
            cabinet,
        });
    } catch (error) {
        next(error);
    }
};
