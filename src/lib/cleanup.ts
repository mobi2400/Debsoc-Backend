import { prisma } from './prisma.js';

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

export const cleanupExpiredFeedbacks = async () => {
    try {
        const cutoffDate = new Date(Date.now() - FIFTEEN_DAYS_MS);

        // Delete expired AnonymousFeedback
        const feedbackResult = await prisma.anonymousFeedback.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        if (feedbackResult.count > 0) {
            console.log(`Cleanup: Deleted ${feedbackResult.count} expired feedback(s).`);
        }

        // Checking if "feedback message" implies messages too. 
        // The prompt says "all feedback message". It's ambiguous.
        // I will stick to AnonymousFeedback to be safe, as deleting Messages might be unwanted.

    } catch (error) {
        console.error('Cleanup: Error deleting expired feedbacks:', error);
    }
};

export const startCleanupSchedule = () => {
    // Run on start
    cleanupExpiredFeedbacks();

    // Run every 24 hours
    // 24 hours * 60 mins * 60 secs * 1000 ms
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    setInterval(cleanupExpiredFeedbacks, TWENTY_FOUR_HOURS);
    console.log('Cleanup schedule started: Checking for expired feedbacks every 24 hours.');
};
