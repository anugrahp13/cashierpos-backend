//import express validator
const { body } = require('express-validator');

//import prisma
const prisma = require('../../prisma/client');

//definisikan validasi untuk login
const validateLogin = [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

module.exports = { validateLogin };