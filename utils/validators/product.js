// Import express validator
const { body, check } = require("express-validator");

// Import prisma client
const prisma = require('../../prisma/client');

// Define validation for create and update product
const validateProduct = [
  body("barcode")
    .notEmpty().withMessage("Barcode is required")
    .custom(async (barcode, { req }) => {
      // Use findFirst instead of findUnique
      const existingProduct = await prisma.product.findFirst({
        where: { barcode: barcode },
      });

      if (existingProduct && (!req.params.id || existingProduct.id !== parseInt(req.params.id))) {
        throw new Error("Barcode must be unique");
      }

      return true;
    }),
  body("category_id").notEmpty().withMessage("Category is required"),
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  check("image").custom((value, { req }) => {
    // Allow image to be optional if it's an update
    if (req.method === 'POST' && !req.file) {
      throw new Error("Image is required");
    }
    return true;
  }),
  body("buy_price").notEmpty().withMessage("Buy Price is required"),
  body("sell_price").notEmpty().withMessage("Sell Price is required"),
  body("stock").notEmpty().withMessage("Stock is required"),
];

module.exports = { validateProduct };