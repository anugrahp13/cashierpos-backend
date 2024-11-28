// Import express
const express = require('express');

// Init express router
const router = express.Router();

// Import validators and middleware
const { validateLogin } = require('../utils/validators');
const { handleValidationErrors } = require('../middlewares');

// Import controllers
const loginController = require('../controllers/LoginController');

// Define routes
const routes = [
  // Login route
  { method: 'post', path: '/login', middlewares: [validateLogin, handleValidationErrors], handler: loginController.login },
];

// Helper function to create routes
const createRoutes = (routes) => {
  routes.forEach(({ method, path, middlewares, handler }) => {
    router[method](path, ...middlewares, handler);
  });
};

// Create routes
createRoutes(routes);

// Export router
module.exports = router;