//import express validator
const { query } = require('express-validator');

const validateSales = [
    query('start_date')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid date'),
    query('end_date')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('End date must be a valid date'),
];

module.exports = { validateSales };