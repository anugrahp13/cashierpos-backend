// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

//import exceljs
const excelJS = require('exceljs');

//import monayFormat
const {moneyFormat} = require('../utils/moneyFormat');

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

// Fungsi export
const exportSales = async (req, res) => {
    try {
        // Hardcode rentang tanggal untuk mencocokkan data di database
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
                grand_total: true, // Hitung semua total grand_total
            },
            where: {
                created_at: {
                    gte: startDate, // Mulai dari startDate
                    lte: endDate,   // Hingga endDate
                },
            },
        });

        // Buat workbook
        const workbook = new excelJS.Workbook();

        // Buat worksheet
        const worksheet = workbook.addWorksheet('Sales');

        // Set header styles
        worksheet.columns = [
            { header: 'DATE', key: 'created_at', width: 25 },
            { header: 'INVOICE', key: 'invoice', width: 30 },
            { header: 'CASHIER', key: 'cashier', width: 15 },
            { header: 'CUSTOMER', key: 'customer', width: 15 },
            { header: 'TOTAL', key: 'grand_total', width: 15 },
        ];

        worksheet.columns.forEach((col) => {
            col.style = {
                font: { bold: true },
                alignment: { horizontal: 'center' },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                },
            };
        });

        // Add sales data to the worksheet
        sales.forEach((sale) => {
            worksheet.addRow({
                created_at: sale.created_at,
                invoice: sale.invoice,
                cashier: sale.cashier.name,
                customer: sale.customer?.name || 'Umum',
                grand_total: `Rp ${moneyFormat(sale.grand_total)}`,
            });
        });

        // Add total row
        const totalRow = worksheet.addRow({
            created_at: '',
            invoice: '',
            cashier: '',
            customer: 'TOTAL',
            grand_total: `Rp ${moneyFormat(total._sum.grand_total)}`,
        });

        // Style total row
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'right' };
            if (colNumber === 5) {
                cell.alignment = { horizontal: 'center' };
            }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Kirimkan respons
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        workbook.xlsx.write(res);

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
    filterSales, exportSales
}