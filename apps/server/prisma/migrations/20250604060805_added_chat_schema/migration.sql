/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Sender" AS ENUM ('user', 'ai');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "chatId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "sender" "Sender" NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_projectId_key" ON "Chat"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_chatId_key" ON "Project"("chatId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
