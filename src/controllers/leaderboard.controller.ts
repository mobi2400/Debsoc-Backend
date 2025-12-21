import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as string; // 'all-time' | 'bi-monthly' (default: 'all-time')

        let dateFilter: any = {};

        if (type === 'bi-monthly') {
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

            dateFilter = {
                session: {
                    sessionDate: {
                        gte: twoMonthsAgo
                    }
                }
            };
        }

        // Fetch all members with their attendance scores
        const allMembers = await prisma.member.findMany({
            select: {
                id: true,
                name: true,
                attendance: {
                    select: { speakerScore: true },
                    where: {
                        status: 'Present',
                        ...dateFilter
                    }
                }
            }
        });

        // Fetch all cabinet members with their attendance scores
        const allCabinet = await prisma.cabinet.findMany({
            select: {
                id: true,
                name: true,
                attendance: {
                    select: { speakerScore: true },
                    where: {
                        status: 'Present',
                        ...dateFilter
                    }
                }
            }
        });

        // Calculate totals and combine
        const leaderboard = [];

        // Process Members
        for (const member of allMembers) {
            const totalScore = member.attendance.reduce((sum, record) => sum + (record.speakerScore || 0), 0);
            leaderboard.push({
                id: member.id,
                name: member.name,
                type: 'Member',
                score: totalScore,
                sessions: member.attendance.length
            });
        }

        // Process Cabinet
        for (const cab of allCabinet) {
            const totalScore = cab.attendance.reduce((sum, record) => sum + (record.speakerScore || 0), 0);
            leaderboard.push({
                id: cab.id,
                name: cab.name,
                type: 'Cabinet',
                score: totalScore,
                sessions: cab.attendance.length
            });
        }

        // Sort by score descending
        leaderboard.sort((a, b) => b.score - a.score);

        // Add rank
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        res.status(200).json({ leaderboard: rankedLeaderboard });
    } catch (error) {
        next(error);
    }
};
