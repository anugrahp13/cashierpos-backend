// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateRandomInvoice } = require("../utils/generateRandomInvoice");

// Fungsi untuk membuat transaksi
const createTransaction = async (req, res) => {
  try {
    // Menghasilkan invoice acak
    const invoice = generateRandomInvoice();

    // Memastikan input numerik valid
    const cashierId = parseInt(req.userId);
    const customerId = parseInt(req.body.customer_id) || null;
    const cash = parseInt(req.body.cash);
    const change = parseInt(req.body.change);
    const discount = parseInt(req.body.discount);
    const grandTotal = parseInt(req.body.grand_total);

    // Memeriksa nilai NaN dan mengembalikan error jika ditemukan
    if (
      isNaN(customerId) ||
      isNaN(cash) ||
      isNaN(change) ||
      isNaN(discount) ||
      isNaN(grandTotal)
    ) {
      return res.status(400).send({
        meta: {
          success: false,
          message: "Data input tidak valid. Silakan periksa permintaan Anda.",
        },
      });
    }

    // Menyisipkan data transaksi ke dalam database
    const transaction = await prisma.transaction.create({
      data: {
        cashier_id: cashierId,
        customer_id: customerId,
        invoice: invoice,
        cash: cash,
        change: change,
        discount: discount,
        grand_total: grandTotal,
      },
    });

    // Mengambil item keranjang untuk kasir saat ini
    const carts = await prisma.cart.findMany({
      where: { cashier_id: cashierId },
      include: { product: true },
    });

    // Memproses setiap item keranjang
    for (const cart of carts) {
      // Memastikan harga adalah float
      const price = parseFloat(cart.price);

      // Menyisipkan detail transaksi
      await prisma.transactionDetail.create({
        data: {
          transaction_id: transaction.id,
          product_id: cart.product_id,
          qty: cart.qty,
          price: price, // Memperbaiki baris ini
        },
      });

      // Menghitung keuntungan
      const totalBuyPrice = cart.product.buy_price * cart.qty;
      const totalSellPrice = cart.product.sell_price * cart.qty;
      const profits = totalSellPrice - totalBuyPrice;

      // Menyisipkan keuntungan
      await prisma.profit.create({
        data: {
          transaction_id: transaction.id,
          total: profits,
        },
      });

      // Memperbarui stok produk
      await prisma.product.update({
        where: { id: cart.product_id },
        data: { stock: { decrement: cart.qty } },
      });
    }

    // Menghapus item keranjang untuk kasir
    await prisma.cart.deleteMany({
      where: { cashier_id: cashierId },
    });

    // Mengirimkan response sukses
    res.status(201).send({
      meta: {
        success: true,
        message: "Transaksi berhasil dibuat",
      },
      data: transaction,
    });
  } catch (error) {
    res.status(500).send({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error.message,
    });
  }
};

// Fungsi findTransactionByInvoice
const findTransactionByInvoice = async (req, res) => {
  // Ambil ID dari parameter URL
  const { invoice } = req.query;

  try {
    // Ambil transaction berdasarkan ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        invoice: invoice,
      },
      select: {
        id: true,
        cashier_id: true,
        customer_id: true,
        invoice: true,
        cash: true,
        change: true,
        discount: true,
        grand_total: true,
        created_at: true,
        customer: {
          select: {
            name: true,
          },
        },
        cashier: {
          select: {
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
        transaction_details: {
          select: {
            id: true,
            product_id: true,
            qty: true,
            price: true,
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      // Jika kategori tidak ditemukan, kirim respons 404
      return res.status(404).send({
        // meta untuk respons dalam format JSON
        meta: {
          success: false,
          message: `Transaksi dengan Invoice: ${invoice} tidak ditemukan`,
        },
      });
    }

    // Kirim respons
    res.status(200).send({
      // meta untuk respons dalam format JSON
      meta: {
        success: true,
        message: `Berhasil mendapatkan transaksi dengan Invoice: ${invoice}`,
      },
      // data transaksi
      data: transaction,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirim respons kesalahan internal server
    res.status(500).send({
      // meta untuk respons dalam format JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // data kesalahan
      errors: error,
    });
  }
};

// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = {
  createTransaction,
  findTransactionByInvoice,
};
