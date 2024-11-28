// Import express
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Import bcrypt
const bcrypt = require("bcryptjs");

// Fungsi findUsers
const findUsers = async (req, res) => {
    try {
        // Mendapatkan halaman dan batas dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Mengambil semua pengguna dari database
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: search,
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Menghitung total pengguna untuk pagination
        const totalUsers = await prisma.user.count({
            where: {
                name: {
                    contains: search,
                }
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalUsers / limit);

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: "Berhasil mengambil semua pengguna",
            },
            //data
            data: users,
            //pagination
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: totalUsers,
            },
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
};

// Fungsi createUser
const createUser = async (req, res) => {
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        // Menyisipkan data pengguna baru
        const user = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });

        // Mengirimkan respons
        res.status(201).send({
            //meta untuk response json
            meta: {
                success: true,
                message: "Pengguna berhasil dibuat",
            },
            //data
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
};

// Fungsi findUserById
const findUserById = async (req, res) => {
    // Mendapatkan ID dari parameter
    const { id } = req.params;

    try {
        // Mengambil pengguna berdasarkan ID
        const user = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user) {
            return res.status(404).send({
                //meta untuk response json
                meta: {
                    success: false,
                    message: `Pengguna dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: `Berhasil mengambil pengguna dengan ID: ${id}`,
            },
            //data
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
};

// Fungsi updateUser
const updateUser = async (req, res) => {
    // Mendapatkan ID dari parameter
    const { id } = req.params;

    // Membuat objek data yang akan diupdate
    let userData = {
        name: req.body.name,
        email: req.body.email,
        updated_at: new Date(),
    };

    try {
        // Only hash and update the password if it's provided
        if (req.body.password !== "") {

            // Hash password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Tambahkan password ke objek data
            userData.password = hashedPassword;
        }

        // Mengupdate pengguna
        const user = await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: userData,
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Pengguna berhasil diperbarui",
            },
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

// Fungsi deleteUser
const deleteUser = async (req, res) => {
    // Mendapatkan ID dari parameter
    const { id } = req.params;

    try {
        // Menghapus pengguna
        await prisma.user.delete({
            where: {
                id: Number(id),
            },
        });

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: "Pengguna berhasil dihapus",
            },
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
};

module.exports = {
    findUsers, createUser, findUserById, updateUser, deleteUser
};