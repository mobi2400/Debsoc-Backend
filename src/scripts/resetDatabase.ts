import { prisma } from '../lib/prisma.js';

async function resetDatabase() {
    try {
        console.log('🗑️  Starting database reset (keeping TechHead)...\n');

        // Delete in order to respect foreign key constraints
        // Delete child tables first, then parent tables

        console.log('Deleting AnonymousFeedback...');
        const deletedFeedbacks = await prisma.anonymousFeedback.deleteMany({});
        console.log(`✅ Deleted ${deletedFeedbacks.count} anonymous feedbacks\n`);

        console.log('Deleting AnonymousMessage...');
        const deletedMessages = await prisma.anonymousMessage.deleteMany({});
        console.log(`✅ Deleted ${deletedMessages.count} anonymous messages\n`);

        console.log('Deleting task...');
        const deletedTasks = await prisma.task.deleteMany({});
        console.log(`✅ Deleted ${deletedTasks.count} tasks\n`);

        console.log('Deleting Attendance...');
        const deletedAttendance = await prisma.attendance.deleteMany({});
        console.log(`✅ Deleted ${deletedAttendance.count} attendance records\n`);

        console.log('Deleting Session...');
        const deletedSessions = await prisma.session.deleteMany({});
        console.log(`✅ Deleted ${deletedSessions.count} sessions\n`);

        console.log('Deleting Member...');
        const deletedMembers = await prisma.member.deleteMany({});
        console.log(`✅ Deleted ${deletedMembers.count} members\n`);

        console.log('Deleting cabinet...');
        const deletedCabinets = await prisma.cabinet.deleteMany({});
        console.log(`✅ Deleted ${deletedCabinets.count} cabinet members\n`);

        console.log('Deleting President...');
        const deletedPresidents = await prisma.president.deleteMany({});
        console.log(`✅ Deleted ${deletedPresidents.count} presidents\n`);

        console.log('✨ Database reset complete! TechHead table preserved.\n');

        // Show remaining TechHead records
        const techHeads = await prisma.techHead.findMany({});
        console.log(`📊 Remaining TechHead records: ${techHeads.length}`);
        techHeads.forEach(th => {
            console.log(`   - ${th.name} (${th.email})`);
        });

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    }
}

resetDatabase()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
