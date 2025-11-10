/*
  Warnings:

  - You are about to drop the column `phone` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `students` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "instructors" DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT';
