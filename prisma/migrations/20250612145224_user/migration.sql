/*
  Warnings:

  - You are about to drop the column `client_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorIds` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `_AssignedTasks` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "_AssignedTasks" DROP CONSTRAINT "_AssignedTasks_A_fkey";

-- DropForeignKey
ALTER TABLE "_AssignedTasks" DROP CONSTRAINT "_AssignedTasks_B_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "client_id",
DROP COLUMN "supervisorIds",
ADD COLUMN     "managerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "creatorId",
ADD COLUMN     "managerId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "priority" SET DEFAULT 'medium';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Admin';

-- DropTable
DROP TABLE "_AssignedTasks";

-- CreateTable
CREATE TABLE "InvitationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "managerId" TEXT,
    "expiry" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationToken_token_key" ON "InvitationToken"("token");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
