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

module.exports = {
    findUsers, createUser
};