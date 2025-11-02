const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt'); // <-- PASTIKAN INI ADA

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Penting untuk membaca JSON dari body

// --- Konfigurasi File Statis & Multer ---
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- API ENDPOINTS (KARYA & PAMERAN) ---

// GET exhibitions (Hardcoded)
app.get('/api/exhibitions', (req, res) => {
  try {
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

// GET landing page
app.get('/api/landing-page', (req, res) => {
  const landingData = {
    title: "Selamat Datang di Pameran Virtual",
    subtitle: "Jelajahi inovasi dan kreativitas dari Politeknik Negeri Batam.",
    backgroundImage: "/background.jpg"
  };
  res.json(landingData);
});

// POST karya baru (dengan upload file)
app.post('/api/karya', upload.single('file'), async (req, res) => {
  try {
    const { title, selectedProdi, description, uploadType, youtubeLink, namaKetua, nim } = req.body;
    let filePath = null;
    if (uploadType === 'file' && req.file) {
      filePath = req.file.filename;
    }

    const karyaBaru = await prisma.karya.create({
      data: {
        title: title,
        prodi: selectedProdi,
        nama_ketua: namaKetua,
        nim: nim,
        description: description,
        upload_type: uploadType,
        file_path: filePath,
        youtube_url: uploadType === 'youtube' ? youtubeLink : null,
        // status: "Pending" (ini sudah di-handle oleh @default di schema.prisma)
      },
    });
    console.log('Data baru berhasil disimpan:', karyaBaru);
    res.status(201).json({ message: "Data berhasil disimpan!", data: karyaBaru });
  } catch (error) {
    console.error("Gagal menyimpan ke database:", error);
    res.status(500).json({ error: 'Gagal menyimpan karya ke database.' });
  }
});

// GET semua karya
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

// PATCH status karya
app.patch('/api/karya/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Disetujui', 'Ditolak'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const updatedKarya = await prisma.karya.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: status,
      },
    });

    res.json({ message: 'Status berhasil diperbarui!', data: updatedKarya });
  } catch (error) {
    console.error("Gagal memperbarui status:", error);
    res.status(500).json({ error: 'Gagal memperbarui status di database.' });
  }
});

// --- BARU: API ENDPOINT OTENTIKASI (LOGIN/REGISTER) ---

// 1. ENDPOINT REGISTER
app.post('/api/register', async (req, res) => {
  const { nama, nim, prodi, password } = req.body;

  if (!nama || !nim || !prodi || !password) {
    return res.status(400).json({ error: 'Semua field wajib diisi.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { nim: nim },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'NIM sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama: nama,
        nim: nim,
        prodi: prodi,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Pendaftaran berhasil!', user: userWithoutPassword });

  } catch (error) {
    console.error("Gagal mendaftar:", error);
    res.status(500).json({ error: 'Gagal membuat akun di database.' });
  }
});

// 2. ENDPOINT LOGIN
app.post('/api/login', async (req, res) => {
  const { nim, password } = req.body;

  if (!nim || !password) {
    return res.status(400).json({ error: 'NIM dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { nim: nim },
    });

    if (!user) {
      return res.status(401).json({ error: 'NIM atau password salah.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'NIM atau password salah.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ message: 'Login berhasil!', user: userWithoutPassword });

  } catch (error) {
    console.error("Gagal login:", error);
    res.status(500).json({ error: 'Terjadi error di server.' });
  }
});

// --- Menjalankan Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});