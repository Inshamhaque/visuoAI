/*
  Warnings:

  - You are about to drop the column `urls` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "urls",
ADD COLUMN     "activeElement" TEXT,
ADD COLUMN     "activeElementIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "activeSection" TEXT NOT NULL DEFAULT 'media',
ADD COLUMN     "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "enableMarkerTracking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "exportSettings" JSONB NOT NULL DEFAULT '{"format":"mp4","fps":30,"includeSubtitles":false,"quality":"high","resolution":"1080p","speed":"fastest"}',
ADD COLUMN     "fps" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "future" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "history" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPlaying" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mediaFiles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "resolution" JSONB NOT NULL DEFAULT '{"width":1920,"height":1080}',
ADD COLUMN     "textElements" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "timelineItems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "timelineZoom" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "zoomLevel" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
