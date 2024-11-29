// Import express untuk membuat server web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Fungsi findProducts untuk mengambil daftar produk dengan paginasi
const findProducts = async (req, res) => {
    try {
        // Mengambil nilai halaman dan limit dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Mengambil semua produk dari database
        const products = await prisma.product.findMany({
            where: {
                title: {
                    contains: search, // Mencari judul produk yang mengandung kata kunci
                },
            },
            select: {
                id: true,
                barcode: true,
                title: true,
                image: true,
                description: true,
                buy_price: true,
                sell_price: true,
                stock: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Mengambil jumlah total produk untuk paginasi
        const totalProducts = await prisma.product.count({
            where: {
                title: {
                    contains: search, // Menghitung jumlah total produk yang sesuai dengan kata kunci pencarian
                },
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalProducts / limit);

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Berhasil mengambil semua produk",
            },
            //data produk
            data: products,
            //paginasi
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalProducts,
            },
        });

    } catch (error) {
        // Mengirim respons jika terjadi kesalahan
        res.status(500).send({
            //meta untuk respons JSON
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            //data kesalahan
            errors: error,
        });
    }
};


// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = { findProducts };