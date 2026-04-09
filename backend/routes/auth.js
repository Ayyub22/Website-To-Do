const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (id, username) => {
  return jwt.sign({ id, username }, process.env.JWT_SECRET || 'TaskFlowSecretDefaultKey', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register — Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Harap isi semua bidang' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          _id: user.id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id, user.username),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Data pengguna tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal melakukan registrasi', error: error.message });
  }
});

// POST /api/auth/login — Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    // Check user email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          _id: user.id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id, user.username),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal melakukan login', error: error.message });
  }
});

// GET /api/auth/me — Get active user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat profil', error: error.message });
  }
});

module.exports = router;
