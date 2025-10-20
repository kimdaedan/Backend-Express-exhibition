const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer'); // <-- BARU
const path = require('path');     // <-- BARU

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Tetap ada untuk endpoint lain

// --- BARU: Menyajikan file statis ---
// Ini akan membuat file di 'public/uploads' bisa diakses
// dari URL: http://localhost:4000/uploads/NAMA_FILE
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- BARU: Konfigurasi Multer untuk penyimpanan file ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Tentukan folder penyimpanan
  },
  filename: function (req, file, cb) {
    // Buat nama file unik agar tidak tumpang tindih
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- API ENDPOINTS ---

// GET exhibitions (Now using hardcoded data again)
app.get('/api/exhibitions', (req, res) => { // Removed 'async'
  try {
    // Re-added the hardcoded data
    const exhibitions = [
        { id: 1, image: '/exhibitions/informatika.jpg', title: 'Prodi D3 Teknik Informatika', organizer: 'IF', link: '/gallery' },
        { id: 2, image: '/exhibitions/multimedia.jpg', title: 'Prodi D4 Teknologi Rekayasa Multimedia', organizer: 'MM', link: '/multimedia' },
        { id: 3, image: '/exhibitions/geomatika.jpg', title: 'Prodi D3 Teknologi Geomatika', organizer: 'GI', link: '#' },
        { id: 4, image: '/exhibitions/animasi.jpg', title: 'Prodi D4 Animasi', organizer: 'AN', link: '#' },
        { id: 5, image: '/exhibitions/siber.png', title: 'Prodi D4 Rekayasa Keamanan Siber', organizer: 'RKS', link: '#' },
        { id: 6, image: '/exhibitions/rpl.jpg', title: 'Prodi D4 Teknologi Rekayasa Perangkat Lunak', organizer: 'TRPL', link: '#' },
        { id: 7, image: '/exhibitions/game.jpg', title: 'Prodi D4 Teknik Permainan', organizer: 'GAME', link: '#' },
        { id: 8, image: '/exhibitions/robotika.jpg', title: 'Prodi D4 Teknologi Rekayasa Mekatronika', organizer: 'MEKA', link: '#' },
    ];

    res.json(exhibitions);
  } catch (error) {
    console.error("Error fetching exhibitions (using static data):", error);
    res.status(500).json({ error: "Gagal mengambil data pameran." });
  }
});

// Endpoint for landing page (Tetap sama)
app.get('/api/landing-page', (req, res) => {
  const landingData = {
    title: "Selamat Datang di Pameran Virtual",
    subtitle: "Jelajahi inovasi dan kreativitas dari Politeknik Negeri Batam.",
    backgroundImage: "/background.jpg"
  };
  res.json(landingData);
});

// --- DIPERBARUI: Endpoint untuk saving new artwork ---
// Kita tambahkan middleware 'upload.single('file')'
// 'file' adalah nama field dari FormData di frontend
app.post('/api/karya', upload.single('file'), async (req, res) => {
  try {
    // Data teks sekarang ada di 'req.body'
    const { title, selectedProdi, description, uploadType, youtubeLink, namaKetua, nim } = req.body;

    // Data file (jika ada) ada di 'req.file'
    let filePath = null;
    if (uploadType === 'file' && req.file) {
      filePath = req.file.filename; // <-- Kita simpan nama file unik yang baru
    }

    const karyaBaru = await prisma.karya.create({
      data: {
        title: title,
        prodi: selectedProdi,
        nama_ketua: namaKetua,
        nim: nim,
        description: description,
        upload_type: uploadType,
        file_path: filePath, // <-- Simpan nama file baru ke DB
        youtube_url: uploadType === 'youtube' ? youtubeLink : null,
      },
    });
    console.log('Data baru berhasil disimpan:', karyaBaru);
    res.status(201).json({ message: "Data berhasil disimpan!", data: karyaBaru });
  } catch (error) {
    console.error("Gagal menyimpan ke database:", error);
    res.status(500).json({ error: 'Gagal menyimpan karya ke database.' });
  }
});


// GET semua karya (Tetap sama)
app.get('/api/karya', async (req, res) => {
  try {
    const allKarya = await prisma.karya.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
    res.json(allKarya);
  } catch (error) {
    console.error("Gagal mengambil data karya:", error);
    res.status(500).json({ error: "Gagal mengambil data dari database." });
  }
});

// --- ENDPOINT BARU UNTUK UPDATE STATUS ---
app.patch('/api/karya/:id/status', async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID dari URL
    const { status } = req.body; // Ambil status baru ("Disetujui" / "Ditolak") dari body

    // Validasi status
    if (!status || !['Disetujui', 'Ditolak'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const updatedKarya = await prisma.karya.update({
      where: {
        id: parseInt(id), // Pastikan ID adalah angka
      },
      data: {
        status: status, // Update kolom status
      },
    });

    res.json({ message: 'Status berhasil diperbarui!', data: updatedKarya });
  } catch (error) {
    console.error("Gagal memperbarui status:", error);
    res.status(500).json({ error: 'Gagal memperbarui status di database.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});