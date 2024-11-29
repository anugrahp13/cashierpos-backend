// Import express untuk membuat server web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import fs untuk operasi sistem file seperti menghapus file
const fs = require('fs');

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

// Fungsi createProduct untuk membuat produk baru
const createProduct = async (req, res) => {
    try {
        // Menyimpan data produk baru
        const product = await prisma.product.create({
            data: {
                barcode: req.body.barcode,
                title: req.body.title,
                description: req.body.description,
                buy_price: parseInt(req.body.buy_price),
                sell_price: parseInt(req.body.sell_price),
                stock: parseInt(req.body.stock),
                image: req.file.path,
                category_id: parseInt(req.body.category_id),
            },
            include: {
                category: true,
            }
        });

        // Mengirim respons
        res.status(201).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Produk berhasil dibuat",
            },
            //data produk
            data: product,
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

// Fungsi findProductById untuk mengambil produk berdasarkan ID
const findProductById = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        // Mengambil produk berdasarkan ID
        const product = await prisma.product.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                barcode: true,
                title: true,
                description: true,
                buy_price: true,
                sell_price: true,
                stock: true,
                image: true,
                category_id: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        name: true,
                        description: true,
                        image: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
            }
        });

        if (!product) {
            return res.status(404).send({
                //meta untuk respons JSON
                meta: {
                    success: false,
                    message: `Produk dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: `Berhasil mengambil produk dengan ID: ${id}`,
            },
            //data produk
            data: product,
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

// Fungsi updateProduct untuk memperbarui produk yang ada
const updateProduct = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        // Mengupdate produk dengan atau tanpa gambar
        const dataProduct = {
            barcode: req.body.barcode,
            title: req.body.title,
            description: req.body.description,
            buy_price: parseInt(req.body.buy_price),
            sell_price: parseInt(req.body.sell_price),
            stock: parseInt(req.body.stock),
            category_id: parseInt(req.body.category_id),
            updated_at: new Date(),
        };

        // cek apakah ada gambar yang diupload
        if (req.file) {

            // Mengassign gambar ke object data produk
            dataProduct.image = req.file.path;

            // get product by id
            const product = await prisma.product.findUnique({
                where: {
                    id: Number(id),
                },
            });
            if (product.image) {

                // Menghapus gambar lama
                fs.unlinkSync(product.image);
            }
        }

        // Mengupdate produk
        const product = await prisma.product.update({
            where: {
                id: Number(id),
            },
            data: dataProduct,
            include: {
                category: true,
            }
        });

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Produk berhasil diperbarui",
            },
            //data produk
            data: product,
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

// Fungsi deleteProduct untuk menghapus produk berdasarkan ID
const deleteProduct = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        // Mengambil produk yang akan dihapus
        const product = await prisma.product.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!product) {
            return res.status(404).send({
                //meta untuk respons JSON
                meta: {
                    success: false,
                    message: `Produk dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Menghapus produk
        await prisma.product.delete({
            where: {
                id: Number(id),
            },
        });

        // Menghapus gambar dari folder uploads jika ada
        if (product.image) {
            const imagePath = product.image;
            const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);
            const filePath = `uploads/${fileName}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Produk berhasil dihapus",
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

// Fungsi findProductByCategoryId untuk mengambil produk berdasarkan category ID
const findProductByCategoryId = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        // Mengambil nilai halaman dan limit dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Mengambil produk berdasarkan category ID
        const products = await prisma.product.findMany({
            where: {
                category_id: Number(id),
            },
            select: {
                id: true,
                barcode: true,
                title: true,
                description: true,
                buy_price: true,
                sell_price: true,
                stock: true,
                image: true,
                category_id: true,
                created_at: true,
                updated_at: true,
            },
            skip: skip,
            take: limit,
        });

        // Mengambil jumlah total produk untuk paginasi
        const totalProducts = await prisma.product.count({
            where: {
                category_id: Number(id), // Hitung produk berdasarkan category ID
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalProducts / limit);

        // Mengirim respons
        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mengambil produk dengan category ID: ${id}`,
            },
            data: products,
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
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            errors: error,
        });
    }
};


// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = { findProducts, createProduct, findProductById, updateProduct, deleteProduct, findProductByCategoryId };