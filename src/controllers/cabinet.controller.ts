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

// Mark Attendance (Create Session and Record Attendance)
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Log the full request for debugging
        console.log('Received markAttendance request');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers);
        
        const { sessionDate, motiontype, Chair, attendanceData } = req.body;
        
        // Check if body was parsed correctly
        if (!req.body || typeof req.body !== 'object') {
            console.error('Invalid request body:', req.body);
            return res.status(400).json({ message: 'Invalid request body. Expected JSON object.' });
        }
        
        console.log('Parsed request data:', { 
            sessionDate, 
            motiontype, 
            Chair, 
            attendanceDataCount: attendanceData?.length,
            attendanceDataType: Array.isArray(attendanceData) ? 'array' : typeof attendanceData
        });
        
        // Validate required fields
        if (!sessionDate || !motiontype || !Chair) {
            return res.status(400).json({ message: 'Please provide sessionDate, motiontype, and Chair' });
        }
        
        if (!Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'attendanceData must be an array' });
        }

        // Handle date conversion - datetime-local format (YYYY-MM-DDTHH:mm) needs proper conversion
        let parsedDate: Date;
        try {
            // If the date string doesn't have timezone info, treat it as local time
            if (sessionDate.includes('T') && !sessionDate.includes('Z') && !sessionDate.includes('+') && !sessionDate.includes('-', 10)) {
                // Format: YYYY-MM-DDTHH:mm (datetime-local format)
                parsedDate = new Date(sessionDate);
            } else {
                // Already in ISO format or has timezone
                parsedDate = new Date(sessionDate);
            }
            
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ 
                    message: `Invalid sessionDate format: "${sessionDate}". Please use ISO 8601 format (e.g., 2025-11-26T14:00:00Z or 2025-11-26T14:00)` 
                });
            }
        } catch (dateError) {
            return res.status(400).json({ 
                message: `Invalid sessionDate format: "${sessionDate}". Error: ${dateError instanceof Error ? dateError.message : 'Unknown error'}` 
            });
        }

        // Allow empty attendance data - session can be created without attendance records
        // But if attendanceData is provided, validate it
        if (attendanceData.length > 0) {
            // Validate each attendance record
            for (let i = 0; i < attendanceData.length; i++) {
                const rec = attendanceData[i];
                if (!rec || typeof rec !== 'object') {
                    return res.status(400).json({ message: `Attendance record at index ${i} is invalid` });
                }
                if (!rec.memberId || typeof rec.memberId !== 'string') {
                    return res.status(400).json({ message: `Attendance record at index ${i} must have a valid memberId (string)` });
                }
                if (!rec.status || (rec.status !== 'Present' && rec.status !== 'Absent')) {
                    return res.status(400).json({ message: `Attendance record at index ${i} must have status as "Present" or "Absent"` });
                }
            }

            // Check if all member IDs exist in the database
            const memberIds = attendanceData.map((rec: { memberId: string }) => rec.memberId);
            const uniqueMemberIds = [...new Set(memberIds)]; // Remove duplicates
            
            const existingMembers = await prisma.member.findMany({
                where: { id: { in: uniqueMemberIds } },
                select: { id: true }
            });

            const existingMemberIds = existingMembers.map(m => m.id);
            const invalidMemberIds = uniqueMemberIds.filter(id => !existingMemberIds.includes(id));

            if (invalidMemberIds.length > 0) {
                return res.status(400).json({ 
                    message: `Invalid member IDs: ${invalidMemberIds.join(', ')}. These members do not exist in the database.` 
                });
            }
        }

        // Create session with attendance records (if any)
        const sessionData: any = {
            sessionDate: parsedDate,
            motiontype: motiontype.trim(),
            Chair: Chair.trim(),
        };

        // Only add attendance if there are records
        if (attendanceData.length > 0) {
            sessionData.attendance = {
                create: attendanceData.map((rec: { memberId: string; status: string }) => ({
                    memberId: rec.memberId,
                    status: rec.status
                }))
            };
        }

        // Create session with attendance records (if any)
        const session = await prisma.session.create({
            data: sessionData,
            include: { attendance: true },
        });
        
        console.log('Session created successfully:', session.id);
        res.status(201).json({ message: 'Session attendance marked successfully', session });
    } catch (error) {
        console.error('Error in markAttendance:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        
        // Handle Prisma-specific errors
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Prisma error codes
            const errorMessage = error.message || '';
            
            if (errorMessage.includes('P2002') || errorMessage.includes('Unique constraint')) {
                return res.status(400).json({ 
                    message: 'A session with these details already exists',
                    error: errorMessage 
                });
            }
            
            if (errorMessage.includes('P2003') || errorMessage.includes('Foreign key constraint') || errorMessage.includes('ForeignKeyConstraintError')) {
                return res.status(400).json({ 
                    message: 'One or more member IDs are invalid. Please ensure all member IDs exist in the database.',
                    error: errorMessage 
                });
            }
            
            if (errorMessage.includes('P1001') || errorMessage.includes('Can\'t reach database server')) {
                return res.status(503).json({ 
                    message: 'Database connection failed. Please try again later.',
                    error: errorMessage 
                });
            }
            
            if (errorMessage.includes('P1017') || errorMessage.includes('Server has closed the connection')) {
                return res.status(503).json({ 
                    message: 'Database connection was closed. Please try again.',
                    error: errorMessage 
                });
            }
            
            // Return detailed error for debugging (even in production for now to help diagnose)
            return res.status(500).json({ 
                message: 'Failed to create session',
                error: errorMessage,
                errorName: error.name,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            });
        }
        
        // Handle non-Error objects
        console.error('Non-Error object caught:', error);
        return res.status(500).json({ 
            message: 'Failed to create session',
            error: 'Unknown error occurred',
            details: String(error)
        });
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