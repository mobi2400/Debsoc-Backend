/*
  Warnings:

  - You are about to drop the column `cabinetId` on the `Attendance` table. All the data in the column will be lost.
  - Made the column `memberId` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_cabinetId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "cabinetId",
ALTER COLUMN "memberId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
