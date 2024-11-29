// Import express
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Fungsi findCarts dengan pagination
const findCarts = async (req, res) => {
  try {
    // Mendapatkan data keranjang dari database
    const carts = await prisma.cart.findMany({
      select: {
        id: true,
        cashier_id: true,
        product_id: true,
        qty: true,
        price: true,
        created_at: true,
        updated_at: true,
        product: {
          select: {
            id: true,
            title: true,
            buy_price: true,
            sell_price: true,
            image: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        cashier_id: parseInt(req.userId),
      },
      orderBy: {
        id: "desc",
      },
    });

    // Menghitung total harga dengan menjumlahkan harga setiap item keranjang
    const totalPrice = carts.reduce((sum, cart) => sum + cart.price, 0);

    // Mengirimkan respon
    res.status(200).send({
      // Meta untuk respon JSON
      meta: {
        success: true,
        message: `Berhasil mendapatkan semua keranjang oleh kasir: ${req.userId}`,
      },
      // Data keranjang
      data: carts,
      totalPrice: totalPrice,
    });
  } catch (error) {
    res.status(500).send({
      // Meta untuk respon JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      // Data kesalahan
      errors: error,
    });
  }
};

// Fungsi createCart
const createCart = async (req, res) => {
  try {
    // Memeriksa apakah produk ada
    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(req.body.product_id),
      },
    });

    if (!product) {
      // Jika produk tidak ada, kembalikan error 404
      return res.status(404).send({
        meta: {
          success: false,
          message: `Produk dengan ID: ${req.body.product_id} tidak ditemukan`,
        },
      });
    }

    // Memeriksa apakah item keranjang dengan product_id dan cashier_id yang sama sudah ada
    const existingCart = await prisma.cart.findFirst({
      where: {
        product_id: parseInt(req.body.product_id),
        cashier_id: req.userId,
      },
    });

    if (existingCart) {
      // Jika item keranjang sudah ada, tambahkan jumlahnya
      const updatedCart = await prisma.cart.update({
        where: {
          id: existingCart.id,
        },
        data: {
          qty: existingCart.qty + parseInt(req.body.qty),
          price:
            product.sell_price * (existingCart.qty + parseInt(req.body.qty)),
          updated_at: new Date(),
        },
        include: {
          product: true,
          cashier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Mengirimkan respon untuk keranjang yang diperbarui
      return res.status(200).send({
        meta: {
          success: true,
          message: "Jumlah keranjang berhasil diperbarui",
        },
        data: updatedCart,
      });
    } else {
      // Jika item keranjang belum ada, buat yang baru
      const cart = await prisma.cart.create({
        data: {
          cashier_id: req.userId,
          product_id: parseInt(req.body.product_id),
          qty: parseInt(req.body.qty),
          price: product.sell_price * parseInt(req.body.qty),
        },
        include: {
          product: true,
          cashier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Mengirimkan respon untuk keranjang yang baru dibuat
      return res.status(201).send({
        meta: {
          success: true,
          message: "Keranjang berhasil dibuat",
        },
        data: cart,
      });
    }
  } catch (error) {
    res.status(500).send({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error,
    });
  }
};

// Fungsi deleteCart
const deleteCart = async (req, res) => {
  // Mendapatkan ID dari params
  const { id } = req.params;

  try {
    // Mendapatkan data keranjang yang akan dihapus
    const cart = await prisma.cart.findUnique({
      where: {
        id: Number(id),
        cashier_id: parseInt(req.userId),
      },
    });

    if (!cart) {
      return res.status(404).send({
        // Meta untuk respon JSON
        meta: {
          success: false,
          message: `Keranjang dengan ID: ${id} tidak ditemukan`,
        },
      });
    }

    // Menghapus keranjang
    await prisma.cart.delete({
      where: {
        id: Number(id),
        cashier_id: parseInt(req.userId),
      },
    });

    // Mengirimkan respon
    res.status(200).send({
      // Meta untuk respon JSON
      meta: {
        success: true,
        message: "Keranjang berhasil dihapus",
      },
    });
  } catch (error) {
    res.status(500).send({
      // Meta untuk respon JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      // Data kesalahan
      errors: error,
    });
  }
};

// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = { findCarts, createCart, deleteCart };
