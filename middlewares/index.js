//import middleware
const verifyToken = require("./auth");
const upload = require("./upload");
const handleValidationErrors = require("./handleValidationErrors");

//export middleware
module.exports = { verifyToken, upload, handleValidationErrors };
