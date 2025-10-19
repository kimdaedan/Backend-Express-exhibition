-- CreateTable
CREATE TABLE "Karya" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "description" TEXT,
    "upload_type" TEXT NOT NULL,
    "file_path" TEXT,
    "youtube_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karya_pkey" PRIMARY KEY ("id")
);
