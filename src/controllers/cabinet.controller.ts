import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register Cabinet Member
export const registerCabinet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, position } = req.body;

        if (!name || !email || !password || !position) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const existingCabinet = await prisma.cabinet.findUnique({
            where: { email },
        });

        if (existingCabinet) {
            return res.status(400).json({ message: 'Cabinet member already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const cabinetMember = await prisma.cabinet.create({
            data: {
                name,
                email,
                password: hashedPassword,
                position,
            },
        });

        const token = jwt.sign({ id: cabinetMember.id, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(201).json({
            message: 'Cabinet member registered successfully',
            token,
            user: { id: cabinetMember.id, name: cabinetMember.name, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Login Cabinet Member
export const loginCabinet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const cabinetMember = await prisma.cabinet.findUnique({
            where: { email },
        });

        if (!cabinetMember) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, cabinetMember.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: cabinetMember.id, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: cabinetMember.id, name: cabinetMember.name, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Mark Attendance (Create Session and Record Attendance)
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionDate, motiontype, Chair, attendanceData } = req.body; // attendanceData: [{ memberId: string, status: "Present" | "Absent" }]

        if (!sessionDate || !motiontype || !Chair || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Please provide all session details and attendance data' });
        }

        const session = await prisma.session.create({
            data: {
                sessionDate: new Date(sessionDate),
                motiontype,
                Chair,
                attendance: {
                    create: attendanceData.map((record: { memberId: string; status: string }) => ({
                        memberId: record.memberId,
                        status: record.status,
                    })),
                },
            },
            include: {
                attendance: true,
            },
        });

        res.status(201).json({
            message: 'Session attendance marked successfully',
            session,
        });
    } catch (error) {
        next(error);
    }
};

// Get Assigned Tasks
export const getAssignedTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cabinetId = req.user?.id;

        if (!cabinetId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const tasks = await prisma.task.findMany({
            where: { assignedToId: cabinetId },
        });

        res.status(200).json({ tasks });
    } catch (error) {
        next(error);
    }
};

// Give Anonymous Feedback to Member
export const giveAnonymousFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { feedback, memberId } = req.body;
        const senderCabinetId = req.user?.id;

        if (!senderCabinetId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!feedback || !memberId) {
            return res.status(400).json({ message: 'Please provide feedback and memberId' });
        }

        const anonymousFeedback = await prisma.anonymousFeedback.create({
            data: {
                feedback,
                memberId,
                senderType: 'cabinet',
                senderCabinetId,
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
// Give Anonymous Message to President
export const giveAnonymousMessageToPresident = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, presidentId } = req.body;
        const senderCabinetId = req.user?.id;

        if (!senderCabinetId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!message || !presidentId) {
            return res.status(400).json({ message: 'Please provide message and presidentId' });
        }

        const anonymousMessage = await prisma.anonymousMessage.create({
            data: {
                message,
                presidentId,
                senderType: 'cabinet',
                senderCabinetId,
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
