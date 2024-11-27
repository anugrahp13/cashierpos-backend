//import express validator
const { body } = require('express-validator');

// Definisikan validasi untuk create cart
const validateCart = [
    body('product_id').notEmpty().withMessage('Product is required'),
    body('qty').notEmpty().withMessage('Qty is required'),
];

module.exports = { validateCart }