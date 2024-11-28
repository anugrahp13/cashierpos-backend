// Import express
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Fungsi findCategories dengan paginasi dan fitur pencarian
const findCategories = async (req, res) => {
    try {
        // Ambil halaman dan limit dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Ambil kategori secara paginasi dari database dengan fitur pencarian
        const categories = await prisma.category.findMany({
            where: {
                name: {
                    contains: search, // Mencari nama kategori yang mengandung kata kunci
                },
            },
            select: {
                id: true,
                name: true,
                image: true,
                description: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Dapatkan total jumlah kategori untuk paginasi
        const totalCategories = await prisma.category.count({
            where: {
                name: {
                    contains: search, // Menghitung jumlah total kategori yang sesuai dengan kata kunci pencarian
                },
            },
        });

        // Hitung total halaman
        const totalPages = Math.ceil(totalCategories / limit);

        // Kirim respons
        res.status(200).send({
            // Meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua kategori",
            },
            // Data kategori
            data: categories,
            // Paginasi
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalCategories,
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

// Ekspor fungsi-fungsi agar dapat digunakan di tempat lain
module.exports = {
    findCategories
};