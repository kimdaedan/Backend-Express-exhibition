/*
  Warnings:

  - You are about to drop the column `file_data` on the `Karya` table. All the data in the column will be lost.
  - You are about to drop the column `file_mimetype` on the `Karya` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Karya" DROP COLUMN "file_data",
DROP COLUMN "file_mimetype",
ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
