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
        const sessionData: {
            sessionDate: Date;
            motiontype: string;
            Chair: string;
            attendance?: {
                create: Array<{ memberId: string; status: string }>;
            };
        } = {
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

        // Log the data structure we're about to send to Prisma
        const logData = {
            sessionDate: sessionData.sessionDate.toISOString(),
            motiontype: sessionData.motiontype,
            Chair: sessionData.Chair,
            hasAttendance: !!sessionData.attendance,
            attendanceCount: sessionData.attendance?.create.length || 0,
            attendanceData: sessionData.attendance?.create || []
        };
        console.log('Attempting to create session with data:', JSON.stringify(logData, null, 2));

        // Create session - use transaction for atomicity
        type SessionWithAttendance = {
            id: string;
            sessionDate: Date;
            motiontype: string;
            Chair: string;
            attendance: Array<{ id: string; memberId: string; status: string }>;
            createdAt: Date;
            updatedAt: Date;
        };
        
        let session: SessionWithAttendance;
        
        try {
            // Use a transaction to ensure atomicity
            const result = await prisma.$transaction(async (tx) => {
                // Create the session first
                const createdSession = await tx.session.create({
                    data: {
                        sessionDate: sessionData.sessionDate,
                        motiontype: sessionData.motiontype,
                        Chair: sessionData.Chair,
                    },
                });
                
                console.log('Session created in transaction:', createdSession.id);
                
                // Create attendance records if any
                if (sessionData.attendance && sessionData.attendance.create.length > 0) {
                    console.log('Creating attendance records:', sessionData.attendance.create.length);
                    await tx.attendance.createMany({
                        data: sessionData.attendance.create.map(att => ({
                            sessionId: createdSession.id,
                            memberId: att.memberId,
                            status: att.status
                        }))
                    });
                    console.log('Attendance records created in transaction');
                }
                
                // Fetch the complete session with attendance
                const completeSession = await tx.session.findUnique({
                    where: { id: createdSession.id },
                    include: { attendance: true }
                });
                
                if (!completeSession) {
                    throw new Error('Failed to retrieve created session');
                }
                
                return completeSession;
            });
            
            session = result as SessionWithAttendance;
            console.log('Transaction completed successfully. Session ID:', session.id);
            
        } catch (createError: any) {
            console.error('='.repeat(80));
            console.error('PRISMA CREATE ERROR - Detailed Information:');
            console.error('Error type:', typeof createError);
            console.error('Error constructor:', createError?.constructor?.name);
            console.error('Error name:', createError?.name);
            console.error('Error code:', createError?.code);
            console.error('Error message:', createError?.message);
            console.error('Error meta:', JSON.stringify(createError?.meta, null, 2));
            console.error('Error clientVersion:', createError?.clientVersion);
            console.error('Error stack:', createError?.stack);
            
            // Try to stringify the full error
            try {
                console.error('Full error object:', JSON.stringify(createError, Object.getOwnPropertyNames(createError), 2));
            } catch (stringifyError) {
                console.error('Could not stringify error:', stringifyError);
            }
            console.error('='.repeat(80));
            throw createError; // Re-throw to be caught by outer catch
        }
        
        res.status(201).json({ message: 'Session attendance marked successfully', session });
    } catch (error: any) {
        console.error('='.repeat(80));
        console.error('ERROR in markAttendance - Full Details:');
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error code:', error?.code);
        console.error('Error meta:', JSON.stringify(error?.meta, null, 2));
        console.error('Error stack:', error?.stack);
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('='.repeat(80));
        
        // Handle Prisma-specific errors
        // Prisma errors have a 'code' property (e.g., 'P2002', 'P2003', etc.)
        if (error?.code) {
            const prismaCode = error.code;
            const errorMessage = error.message || 'Unknown Prisma error';
            
            console.error(`Prisma error code: ${prismaCode}`);
            
            switch (prismaCode) {
                case 'P2002':
                    return res.status(400).json({ 
                        message: 'A session with these details already exists',
                        error: errorMessage,
                        code: prismaCode,
                        meta: error.meta
                    });
                
                case 'P2003':
                    return res.status(400).json({ 
                        message: 'One or more member IDs are invalid. Please ensure all member IDs exist in the database.',
                        error: errorMessage,
                        code: prismaCode,
                        meta: error.meta
                    });
                
                case 'P1001':
                case 'P1008':
                    return res.status(503).json({ 
                        message: 'Database connection failed. Please try again later.',
                        error: errorMessage,
                        code: prismaCode
                    });
                
                case 'P1017':
                    return res.status(503).json({ 
                        message: 'Database connection was closed. Please try again.',
                        error: errorMessage,
                        code: prismaCode
                    });
                
                default:
                    // Log unknown Prisma error code for debugging
                    console.error(`Unknown Prisma error code: ${prismaCode}`);
                    return res.status(500).json({ 
                        message: `Database error occurred (Code: ${prismaCode})`,
                        error: errorMessage,
                        code: prismaCode,
                        meta: error.meta,
                        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
                    });
            }
        }
        
        // Handle standard Error objects
        if (error instanceof Error) {
            const errorMessage = error.message || 'Unknown error';
            
            // Check for common error patterns in message
            if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('ForeignKeyConstraintError')) {
                return res.status(400).json({ 
                    message: 'One or more member IDs are invalid. Please ensure all member IDs exist in the database.',
                    error: errorMessage,
                    errorName: error.name
                });
            }
            
            if (errorMessage.includes('Unique constraint') || errorMessage.includes('UniqueConstraintError')) {
                return res.status(400).json({ 
                    message: 'A session with these details already exists',
                    error: errorMessage,
                    errorName: error.name
                });
            }
            
            // Return detailed error for debugging
            return res.status(500).json({ 
                message: 'Failed to create session',
                error: errorMessage,
                errorName: error.name,
                stack: error.stack // Include stack trace for debugging
            });
        }
        
        // Handle non-Error objects (strings, objects, etc.)
        console.error('Non-Error object caught:', error);
        const errorString = error?.toString() || String(error);
        return res.status(500).json({ 
            message: 'Failed to create session',
            error: errorString,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
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