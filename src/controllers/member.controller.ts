import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register Member
export const registerMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const existingMember = await prisma.member.findUnique({
            where: { email },
        });

        if (existingMember) {
            return res.status(400).json({ message: 'Member already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const member = await prisma.member.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ id: member.id, email: member.email, role: 'Member', isVerified: member.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(201).json({
            message: 'Member registered successfully',
            token,
            user: { id: member.id, name: member.name, email: member.email, role: 'Member', isVerified: member.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Login Member
export const loginMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const member = await prisma.member.findUnique({
            where: { email },
        });

        if (!member) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, member.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: member.id, email: member.email, role: 'Member', isVerified: member.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: member.id, name: member.name, email: member.email, role: 'Member', isVerified: member.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Get My Attendance
export const getMyAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const memberId = req.user?.id;

        if (!memberId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const attendance = await prisma.attendance.findMany({
            where: { memberId },
            include: {
                session: true,
            },
            orderBy: {
                session: {
                    sessionDate: 'desc',
                },
            },
        });

        res.status(200).json({ attendance });
    } catch (error) {
        next(error);
    }
};

// Get Assigned Tasks
export const getAssignedTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const memberId = req.user?.id;

        if (!memberId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const tasks = await prisma.task.findMany({
            where: { assignedToMemberId: memberId },
        });

        res.status(200).json({ tasks });
    } catch (error) {
        next(error);
    }
};

// Give Anonymous Message to President
export const giveAnonymousMessageToPresident = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, presidentId } = req.body;
        const senderMemberId = req.user?.id;

        if (!senderMemberId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!message || !presidentId) {
            return res.status(400).json({ message: 'Please provide message and presidentId' });
        }

        const anonymousMessage = await prisma.anonymousMessage.create({
            data: {
                message,
                presidentId,
                senderType: 'Member',
                senderMemberId,
            },
        });

        res.status(201).json({
            message: 'Anonymous message sent to President successfully',
            data: anonymousMessage,
        });
    } catch (error) {
        next(error);
    }
};

// Get My Feedback (from Cabinet or President)
export const getMyFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const memberId = req.user?.id;

        if (!memberId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const feedbacks = await prisma.anonymousFeedback.findMany({
            where: { memberId },
            select: {
                id: true,
                feedback: true,
                senderType: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({ feedbacks });
    } catch (error) {
        next(error);
    }
};
