/*
  Warnings:

  - You are about to drop the column `file_path` on the `Karya` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Karya` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Karya" DROP COLUMN "file_path",
DROP COLUMN "updated_at",
ADD COLUMN     "file_data" BYTEA,
ADD COLUMN     "file_mimetype" TEXT;
