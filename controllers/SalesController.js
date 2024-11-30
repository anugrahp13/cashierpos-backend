// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Fungsi untuk memfilter data penjualan berdasarkan rentang tanggal
const filterSales = async (req, res) => {
    try {
        // Mengambil rentang tanggal untuk mencocokkan data di database
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999); // Pastikan mencakup seluruh hari

        // Ambil data penjualan dalam rentang tanggal
        const sales = await prisma.transaction.findMany({
            where: {
                created_at: {
                    gte: startDate, // Mulai dari startDate
                    lte: endDate,   // Hingga endDate
                },
            },
            include: {
                cashier: {
                    select: {
                        id: true,   // Pilih ID kasir
                        name: true, // Pilih nama kasir
                    },
                },
                customer: {
                    select: {
                        id: true,   // Pilih ID pelanggan
                        name: true, // Pilih nama pelanggan
                    },
                },
            },
        });

        // Hitung total penjualan dalam rentang tanggal
        const total = await prisma.transaction.aggregate({
            _sum: {
                grand_total: true, // Hitung jumlah total grand_total
            },
            where: {
                created_at: {
                    gte: startDate, // Mulai dari startDate
                    lte: endDate,   // Hingga endDate
                },
            },
        });

        // Kirimkan respons
        res.status(200).json({
            meta: {
                success: true, // Status sukses
                message: `Data penjualan dari ${req.query.start_date} hingga ${req.query.end_date} berhasil diambil`, // Pesan keberhasilan
            },
            data: {
                sales: sales, // Data penjualan
                total: total._sum.grand_total || 0, // Total penjualan, jika tidak ada total maka default 0
            },
        });
    } catch (error) {
        // Jika terjadi kesalahan, kirimkan respons kesalahan
        res.status(500).send({
            meta: {
                success: false, // Status gagal
                message: "Terjadi kesalahan pada server", // Pesan kesalahan
            },
            errors: error, // Detail kesalahan
        });
    }
};

// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = {
    filterSales
}