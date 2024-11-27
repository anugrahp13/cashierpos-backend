const { body, check } = require('express-validator');

// Define validation for category with optional file
const validateCategory = [
  body('name')
    .notEmpty().withMessage('Name is required'),

  check('image')
    .optional() // Makes the image check optional
    .custom((value, { req }) => {
      // Check if file is uploaded during creation or update
      if (req.method === 'POST' && !req.file) {
        // If creating (POST) and no file is uploaded, throw an error
        throw new Error('Image is required');
      }

      // No need to check image on update if not provided
      return true;
    }),
    body('description')
    .notEmpty().withMessage('Description is required'),
];

module.exports = { validateCategory };