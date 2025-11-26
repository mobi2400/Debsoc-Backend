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
        const existingCabinet = await prisma.cabinet.findUnique({ where: { email } });
        if (existingCabinet) {
            return res.status(400).json({ message: 'Cabinet member already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const cabinetMember = await prisma.cabinet.create({
            data: { name, email, password: hashedPassword, position },
        });
        const token = jwt.sign(
            { id: cabinetMember.id, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );
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
        const cabinetMember = await prisma.cabinet.findUnique({ where: { email } });
        if (!cabinetMember) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, cabinetMember.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: cabinetMember.id, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: cabinetMember.id, name: cabinetMember.name, email: cabinetMember.email, role: 'cabinet', isVerified: cabinetMember.isVerified },
        });
    } catch (error) {
        next(error);
    }
};

// Create Session
export const createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionDate, motiontype, Chair } = req.body;

        // Validate required fields
        if (!sessionDate || !motiontype || !Chair) {
            return res.status(400).json({ message: 'Please provide sessionDate, motiontype, and Chair' });
        }

        // Handle date conversion
        let parsedDate: Date;
        try {
            if (sessionDate.includes('T') && !sessionDate.includes('Z') && !sessionDate.includes('+') && !sessionDate.includes('-', 10)) {
                parsedDate = new Date(sessionDate);
            } else {
                parsedDate = new Date(sessionDate);
            }

            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: `Invalid sessionDate format: "${sessionDate}". Please use ISO 8601 format.`
                });
            }
        } catch (dateError) {
            return res.status(400).json({
                message: `Invalid sessionDate format. Error: ${dateError instanceof Error ? dateError.message : 'Unknown error'}`
            });
        }

        const session = await prisma.session.create({
            data: {
                sessionDate: parsedDate,
                motiontype: motiontype.trim(),
                Chair: Chair.trim(),
            },
        });

        res.status(201).json({ message: 'Session created successfully', session });
    } catch (error) {
        next(error);
    }
};

// Mark Attendance for an Existing Session
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, attendanceData } = req.body;

        if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Please provide sessionId and attendanceData (array)' });
        }

        // Validate session exists
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Validate attendance records
        for (let i = 0; i < attendanceData.length; i++) {
            const rec = attendanceData[i];
            if (!rec.memberId || typeof rec.memberId !== 'string') {
                return res.status(400).json({ message: `Invalid memberId at index ${i}` });
            }
            if (!rec.status || (rec.status !== 'Present' && rec.status !== 'Absent')) {
                return res.status(400).json({ message: `Invalid status at index ${i}` });
            }
        }

        // Create attendance records
        // We use a transaction to ensure all or nothing
        const result = await prisma.$transaction(async (tx) => {
            // Optional: Delete existing attendance for this session if you want to overwrite
            // await tx.attendance.deleteMany({ where: { sessionId } });

            const createdAttendance = await tx.attendance.createMany({
                data: attendanceData.map((rec: { memberId: string; status: string }) => ({
                    sessionId,
                    memberId: rec.memberId,
                    status: rec.status
                }))
            });
            return createdAttendance;
        });

        res.status(201).json({ message: 'Attendance marked successfully', count: result.count });
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
        const tasks = await prisma.task.findMany({ where: { assignedToId: cabinetId } });
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
            data: { feedback, memberId, senderType: 'cabinet', senderCabinetId },
        });
        res.status(201).json({ message: 'Anonymous feedback sent successfully', feedback: anonymousFeedback });
    } catch (error) {
        next(error);
    }
};

// Get Session Reports
export const getSessionReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await prisma.session.findMany({ orderBy: { sessionDate: 'desc' } });
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
            data: { message, presidentId, senderType: 'cabinet', senderCabinetId },
        });
        res.status(201).json({ message: 'Anonymous message sent to President successfully', data: anonymousMessage });
    } catch (error) {
        next(error);
    }
};

// Get Dashboard Data (Members, Cabinet, Presidents)
export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await prisma.member.findMany({ select: { id: true, name: true, email: true, isVerified: true } });
        const cabinet = await prisma.cabinet.findMany({ select: { id: true, name: true, email: true, position: true, isVerified: true } });
        const presidents = await prisma.president.findMany({ select: { id: true, name: true, email: true, isVerified: true } });
        res.status(200).json({ members, cabinet, presidents });
    } catch (error) {
        next(error);
    }
};

// Get Sent Messages (to President)
export const getSentMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cabinetId = req.user?.id;
        if (!cabinetId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const messages = await prisma.anonymousMessage.findMany({
            where: { senderCabinetId: cabinetId },
            orderBy: { createdAt: 'desc' },
            include: { president: { select: { name: true, email: true } } },
        });
        res.status(200).json({ messages });
    } catch (error) {
        next(error);
    }
};

// Get Sent Feedback
export const getSentFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cabinetId = req.user?.id;
        if (!cabinetId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const feedbacks = await prisma.anonymousFeedback.findMany({
            where: { senderCabinetId: cabinetId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                feedback: true,
                memberId: true,
                senderType: true,
                createdAt: true,
                member: { select: { name: true, email: true } },
            },
        });
        res.status(200).json({ feedbacks });
    } catch (error) {
        next(error);
    }
};