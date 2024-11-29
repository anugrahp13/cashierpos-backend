// Mengimpor express
const express = require("express");

// Mengimpor prisma client
const prisma = require("../prisma/client");

// Fungsi findCustomers dengan pagination
const findCustomers = async (req, res) => {
  try {
    // Mendapatkan nilai page dan limit dari parameter query, dengan nilai default
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Ambil kata kunci pencarian dari parameter query
    const search = req.query.search || "";

    // Mendapatkan data pelanggan yang dipaginasikan dari database
    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: search, // Mencari nama pelanggan yang mengandung kata kunci
        },
      },
      select: {
        id: true,
        name: true,
        no_telp: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        id: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Mendapatkan total jumlah pelanggan untuk pagination
    const totalCustomers = await prisma.customer.count({
      where: {
        name: {
          contains: search, // Menghitung total pelanggan yang sesuai dengan kata kunci pencarian
        },
      },
    });

    // Menghitung total halaman
    const totalPages = Math.ceil(totalCustomers / limit);

    // Mengirimkan respons
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Berhasil mendapatkan semua pelanggan",
      },
      // Data pelanggan
      data: customers,
      // Data pagination
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        perPage: limit,
        total: totalCustomers,
      },
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi createCustomer untuk membuat pelanggan baru
const createCustomer = async (req, res) => {
  try {
    // Menyisipkan data pelanggan baru ke dalam database
    const customer = await prisma.customer.create({
      data: {
        name: req.body.name,
        no_telp: req.body.no_telp,
        address: req.body.address,
      },
    });

    // Mengirimkan respons setelah berhasil membuat pelanggan baru
    res.status(201).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Pelanggan berhasil dibuat",
      },
      // Data pelanggan yang baru dibuat
      data: customer,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi findCustomerById untuk mendapatkan pelanggan berdasarkan ID
const findCustomerById = async (req, res) => {
  // Mendapatkan ID dari parameter
  const { id } = req.params;

  try {
    // Mendapatkan pelanggan berdasarkan ID
    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        name: true,
        no_telp: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Jika pelanggan tidak ditemukan, kirimkan respons 404
    if (!customer) {
      return res.status(404).send({
        // Meta untuk respons JSON
        meta: {
          success: false,
          message: `Pelanggan dengan ID: ${id} tidak ditemukan`,
        },
      });
    }

    // Mengirimkan respons setelah berhasil mendapatkan pelanggan berdasarkan ID
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: `Berhasil mendapatkan pelanggan dengan ID: ${id}`,
      },
      // Data pelanggan
      data: customer,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi updateCustomer untuk memperbarui data pelanggan
const updateCustomer = async (req, res) => {
  // Mendapatkan ID dari parameter
  const { id } = req.params;

  try {
    // Memperbarui data pelanggan berdasarkan ID
    const customer = await prisma.customer.update({
      where: {
        id: Number(id),
      },
      data: {
        name: req.body.name,
        no_telp: req.body.no_telp,
        address: req.body.address,
        updated_at: new Date(),
      },
    });

    // Mengirimkan respons setelah berhasil memperbarui pelanggan
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Pelanggan berhasil diperbarui",
      },
      // Data pelanggan yang diperbarui
      data: customer,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi deleteCustomer untuk menghapus pelanggan
const deleteCustomer = async (req, res) => {
  // Mendapatkan ID dari parameter
  const { id } = req.params;

  try {
    // Mendapatkan data pelanggan yang akan dihapus
    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(id),
      },
    });

    // Jika pelanggan tidak ditemukan, kirimkan respons 404
    if (!customer) {
      return res.status(404).send({
        // Meta untuk respons JSON
        meta: {
          success: false,
          message: `Pelanggan dengan ID: ${id} tidak ditemukan`,
        },
      });
    }

    // Menghapus pelanggan berdasarkan ID
    await prisma.customer.delete({
      where: {
        id: Number(id),
      },
    });

    // Mengirimkan respons setelah berhasil menghapus pelanggan
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Pelanggan berhasil dihapus",
      },
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi allCustomers
const allCustomers = async (req, res) => {
  try {
    // Mendapatkan data pelanggan
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Map the customers to the desired format
    const formattedCustomers = customers.map((customer) => ({
      value: customer.id,
      label: customer.name,
    }));

    // Mengirimkan respons
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Berhasil mendapatkan semua pelanggan",
      },
      // Data pelanggan
      data: formattedCustomers,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Mengekspor fungsi-fungsi untuk digunakan di modul lain
module.exports = {
  findCustomers,
  createCustomer,
  findCustomerById,
  updateCustomer,
  deleteCustomer,
  allCustomers,
};
