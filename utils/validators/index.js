//import validator
const { validateLogin } = require("./auth");
const { validateUser } = require("./user");
const { validateCategory } = require("./category");
const { validateProduct } = require("./product");
const { validateCustomer } = require("./customer");
const { validateCart } = require("./cart");
const { validateTransaction } = require("./transaction");
const { validateSales } = require("./sale");
const { validateProfit } = require("./profit");

//export validator
module.exports = { 
    validateLogin, 
    validateUser, 
    validateCategory,
    validateProduct,
    validateCustomer,
    validateCart,
    validateTransaction,
    validateSales,
    validateProfit
};