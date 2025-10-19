// backend-express/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- API ENDPOINTS ---

// DIUBAH: Endpoint ini sekarang mengambil data dari database
app.get('/api/exhibitions', async (req, res) => {
  try {
    // Gunakan Prisma untuk mengambil semua data dari tabel "Karya"
    const allKarya = await prisma.karya.findMany({
      orderBy: {
        created_at: 'desc', // Tampilkan yang terbaru di atas
      },
    });

    // Ubah format data agar sesuai dengan yang diharapkan frontend
    const formattedExhibitions = allKarya.map(karya => ({
      id: karya.id,
      // Asumsi gambar ada di folder /exhibitions/, gunakan gambar default jika tidak ada
      image: karya.file_path ? `/exhibitions/${karya.file_path}` : '/exhibitions/default.jpg',
      title: karya.title,
      organizer: karya.prodi, // Gunakan 'prodi' sebagai 'organizer'
      link: `/gallery/${karya.id}`, // Buat link dinamis ke halaman detail
    }));

    res.json(formattedExhibitions);
  } catch (error) {
    console.error("Gagal mengambil data dari database:", error);
    res.status(500).json({ error: "Gagal mengambil data pameran." });
  }
});

// Endpoint untuk landing page (tetap sama)
app.get('/api/landing-page', (req, res) => {
  const landingData = {
    title: "Selamat Datang di Pameran Virtual",
    subtitle: "Jelajahi inovasi dan kreativitas dari Politeknik Negeri Batam.",
    backgroundImage: "/background.jpg"
  };
  res.json(landingData);
});

// Endpoint untuk menyimpan karya baru (sedikit disempurnakan)
app.post('/api/karya', async (req, res) => {
  try {
    const { title, selectedProdi, description, uploadType, file, youtubeLink } = req.body;

    const karyaBaru = await prisma.karya.create({
      data: {
        title: title,
        prodi: selectedProdi,
        description: description,
        upload_type: uploadType,
        file_path: uploadType === 'file' && file ? file.name : null,
        youtube_url: uploadType === 'youtube' ? youtubeLink : null,
      },
    });

    console.log('Data baru berhasil disimpan:', karyaBaru);
    // DIUBAH: Memberikan respons yang lebih informatif
    res.status(201).json({ message: "Data berhasil disimpan!", data: karyaBaru });

  } catch (error) {
    console.error("Gagal menyimpan ke database:", error);
    res.status(500).json({ error: 'Gagal menyimpan karya ke database.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});