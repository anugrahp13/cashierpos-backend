// Import express
const express = require("express");

// Import bcrypt untuk enkripsi password
const bcrypt = require("bcryptjs");

// Import jsonwebtoken untuk pembuatan token JWT
const jwt = require("jsonwebtoken");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Fungsi login
const login = async (req, res) => {
  
  try {
    // Mencari pengguna berdasarkan email
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email, // Menggunakan email yang diberikan dari request body
      },
      select: {
        id: true,       // Mengambil ID pengguna
        name: true,     // Mengambil nama pengguna
        email: true,    // Mengambil email pengguna
        password: true, // Mengambil password pengguna
      },
    });

    // Jika pengguna tidak ditemukan
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan", // Pesan jika pengguna tidak ditemukan
      });

    // Membandingkan password yang diberikan dengan password yang disimpan di database
    const validPassword = await bcrypt.compare(
      req.body.password,  // Password yang diberikan oleh pengguna
      user.password       // Password yang tersimpan di database
    );

    // Jika password salah
    if (!validPassword)
      return res.status(401).json({
        success: false,
        message: "Password tidak valid", // Pesan jika password salah
      });

    // Membuat token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token berlaku selama 1 jam
    });

    // Mendestructur password agar tidak dikembalikan dalam respons
    const { password, ...userWithoutPassword } = user;

    // Mengembalikan respons jika login berhasil
    res.status(200).send({
      meta: {
        success: true,
        message: "Login berhasil", // Pesan jika login berhasil
      },
      data: {
        user: userWithoutPassword, // Mengembalikan data pengguna tanpa password
        token: token,              // Mengembalikan token yang telah dibuat
      },
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirim respons kesalahan internal server
    res.status(500).send({
        // Meta untuk respons dalam format JSON
        meta: {
            success: false,
            message: "Terjadi kesalahan di server",
        },
        // Data kesalahan
        errors: error,
    });
  }
};

// Mengekspor fungsi login agar dapat digunakan di tempat lain
module.exports = { login };