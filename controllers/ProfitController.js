// Import express untuk membuat server
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

//import exceljs
const excelJS = require("exceljs");

//import moneyFormat
const { moneyFormat } = require("../utils/moneyFormat");

// Fungsi untuk memfilter data profit berdasarkan rentang tanggal
const filterProfit = async (req, res) => {
  try {
    // Menetapkan rentang tanggal berdasarkan parameter query dari request
    const startDate = new Date(req.query.start_date);
    const endDate = new Date(req.query.end_date);
    endDate.setHours(23, 59, 59, 999); // Mengatur endDate agar mencakup seluruh hari

    // Mengambil data profit dalam rentang tanggal yang ditentukan
    const profits = await prisma.profit.findMany({
      where: {
        created_at: {
          gte: startDate, // Mengambil data yang dibuat setelah atau pada startDate
          lte: endDate, // Mengambil data yang dibuat sebelum atau pada endDate
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            invoice: true,
            grand_total: true,
            created_at: true,
          },
        },
      },
    });

    // Menghitung total profit dalam rentang tanggal yang ditentukan
    const total = await prisma.profit.aggregate({
      _sum: {
        total: true, // Menghitung jumlah total profit
      },
      where: {
        created_at: {
          gte: startDate, // Mengambil data yang dibuat setelah atau pada startDate
          lte: endDate, // Mengambil data yang dibuat sebelum atau pada endDate
        },
      },
    });

    // Mengirim respons dengan status 200 (OK)
    res.status(200).json({
      meta: {
        success: true,
        message: `Data profit dari ${req.query.start_date} hingga ${req.query.end_date} berhasil diambil`,
      },
      data: {
        profits: profits, // Data profit yang diambil
        total: total._sum.total || 0, // Total profit atau 0 jika tidak ada
      },
    });
  } catch (error) {
    // Mengirim respons dengan status 500 (Internal Server Error) jika terjadi kesalahan
    res.status(500).send({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error, // Mengirimkan detail kesalahan
    });
  }
};

// Fungsi untuk mengexport data profit dalam bentuk excel
const exportProfit = async (req, res) => {
  try {
    // Menetapkan rentang tanggal berdasarkan parameter query dari request
    const startDate = new Date(req.query.start_date);
    const endDate = new Date(req.query.end_date);
    endDate.setHours(23, 59, 59, 999); // Mengatur endDate agar mencakup seluruh hari

    // Mengambil data profit dalam rentang tanggal yang ditentukan
    const profits = await prisma.profit.findMany({
      where: {
        created_at: {
          gte: startDate, // Mengambil data yang dibuat setelah atau pada startDate
          lte: endDate, // Mengambil data yang dibuat sebelum atau pada endDate
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            invoice: true,
          },
        },
      },
    });

    // Menghitung total profit dalam rentang tanggal yang ditentukan
    const total = await prisma.profit.aggregate({
      _sum: {
        total: true, // Menghitung semua total profit
      },
      where: {
        created_at: {
          gte: startDate, // Mengambil data yang dibuat setelah atau pada startDate
          lte: endDate, // Mengambil data yang dibuat sebelum atau pada endDate
        },
      },
    });

    // Membuat workbook excel
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Profits");

    // Menambahkan judul kolom
    worksheet.columns = [
      { header: "DATE", key: "created_at", width: 10 },
      { header: "INVOICE", key: "invoice", width: 20 },
      { header: "TOTAL", key: "total", width: 20 },
    ];

    worksheet.columns.forEach((col) => {
      col.style = {
        font: { bold: true },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };
    });

    // Menambahkan data ke worksheet
    profits.forEach((profit) => {
      worksheet.addRow({
        created_at: profit.created_at,
        invoice: profit.transaction.invoice,
        total: moneyFormat(profit.total),
      });
    });

    // Add total row
    const totalRow = worksheet.addRow({
      created_at: "",
      invoice: "TOTAL",
      total: `Rp ${moneyFormat(total._sum.total)}`,
    });

    // Style total row
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "right" };
      if (colNumber === 5) {
        cell.alignment = { horizontal: "center" };
      }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // kirim respons
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    workbook.xlsx.write(res);
  } catch (error) {
    // Mengirim respons dengan status 500 (Internal Server Error) jika terjadi kesalahan
    res.status(500).send({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error, // Mengirimkan detail kesalahan
    });
  }
};

// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = {
  filterProfit,
  exportProfit,
};
