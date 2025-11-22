import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Login TechHead
export const loginTechHead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const techHead = await prisma.techHead.findUnique({
            where: { email },
        });

        if (!techHead) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, techHead.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: techHead.id, email: techHead.email, role: 'TechHead', isVerified: true }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: techHead.id, name: techHead.name, email: techHead.email, role: 'TechHead' },
        });
    } catch (error) {
        next(error);
    }
};

// Verify President
export const verifyPresident = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { presidentId } = req.body;
        const techHeadId = req.user?.id;

        if (!techHeadId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!presidentId) {
            return res.status(400).json({ message: 'President ID is required' });
        }

        const president = await prisma.president.findUnique({
            where: { id: presidentId },
        });

        if (!president) {
            return res.status(404).json({ message: 'President not found' });
        }

        if (president.isVerified) {
            return res.status(400).json({ message: 'President is already verified' });
        }

        const updatedPresident = await prisma.president.update({
            where: { id: presidentId },
            data: {
                isVerified: true,
                verifiedByTechHeadId: techHeadId,
            },
        });

        res.status(200).json({
            message: 'President verified successfully',
            president: {
                id: updatedPresident.id,
                name: updatedPresident.name,
                isVerified: updatedPresident.isVerified,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Verify Cabinet
export const verifyCabinet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cabinetId } = req.body;
        const techHeadId = req.user?.id;

        if (!techHeadId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!cabinetId) {
            return res.status(400).json({ message: 'Cabinet ID is required' });
        }

        const cabinetMember = await prisma.cabinet.findUnique({
            where: { id: cabinetId },
        });

        if (!cabinetMember) {
            return res.status(404).json({ message: 'Cabinet member not found' });
        }

        if (cabinetMember.isVerified) {
            return res.status(400).json({ message: 'Cabinet member is already verified' });
        }

        const updatedCabinet = await prisma.cabinet.update({
            where: { id: cabinetId },
            data: {
                isVerified: true,
                verifiedByTechHeadId: techHeadId,
            },
        });

        res.status(200).json({
            message: 'Cabinet member verified successfully',
            cabinet: {
                id: updatedCabinet.id,
                name: updatedCabinet.name,
                isVerified: updatedCabinet.isVerified,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Verify Member
export const verifyMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { memberId } = req.body;
        const techHeadId = req.user?.id;

        if (!techHeadId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!memberId) {
            return res.status(400).json({ message: 'Member ID is required' });
        }

        const member = await prisma.member.findUnique({
            where: { id: memberId },
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (member.isVerified) {
            return res.status(400).json({ message: 'Member is already verified' });
        }

        const updatedMember = await prisma.member.update({
            where: { id: memberId },
            data: {
                isVerified: true,
                verifiedByTechHeadId: techHeadId,
            },
        });

        res.status(200).json({
            message: 'Member verified successfully',
            member: {
                id: updatedMember.id,
                name: updatedMember.name,
                isVerified: updatedMember.isVerified,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get all unverified users (helper for TechHead dashboard)
export const getUnverifiedUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unverifiedPresidents = await prisma.president.findMany({
            where: { isVerified: false },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        const unverifiedCabinet = await prisma.cabinet.findMany({
            where: { isVerified: false },
            select: { id: true, name: true, email: true, position: true, createdAt: true },
        });

        const unverifiedMembers = await prisma.member.findMany({
            where: { isVerified: false },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        res.status(200).json({
            unverifiedPresidents,
            unverifiedCabinet,
            unverifiedMembers,
        });
    } catch (error) {
        next(error);
    }
};
