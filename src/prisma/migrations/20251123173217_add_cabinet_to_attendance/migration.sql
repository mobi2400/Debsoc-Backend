-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "cabinetId" TEXT,
ALTER COLUMN "memberId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
