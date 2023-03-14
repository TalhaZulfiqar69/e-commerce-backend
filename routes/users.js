const express = require('express');
const router = express.Router();

const loginValidation = require('../helpers/validation_helper')

module.exports = router;
const AuthController = require("../controllers/auth.controller");

router.get("/login", loginValidation, AuthController.login); // Admin Login api

module.exports = router;
