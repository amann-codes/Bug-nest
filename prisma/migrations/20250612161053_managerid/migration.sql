/*
  Warnings:

  - You are about to drop the column `managerIds` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `InvitationToken` table. All the data in the column will be lost.
  - Added the required column `managerId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `InvitationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "managerIds",
ADD COLUMN     "managerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InvitationToken" DROP COLUMN "clientId",
ADD COLUMN     "userId" TEXT NOT NULL;
