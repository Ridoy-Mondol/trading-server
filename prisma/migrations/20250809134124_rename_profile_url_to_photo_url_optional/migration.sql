/*
  Warnings:

  - You are about to drop the column `profileUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "profileUrl",
ADD COLUMN     "photoUrl" TEXT;
