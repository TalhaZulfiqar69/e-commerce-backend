const express = require('express');
const router = express.Router();

const {loginValidation,registrationValidation} = require('../helpers/validation_helper')
const AuthController = require("../controllers/auth.controller");

router.post("/login", loginValidation, AuthController.login); // Admin Login api
router.post("/register", registrationValidation, AuthController.register)
router.post("/get-user-profile", AuthController.getUserProfile)
router.post("/account-verification", AuthController.accountVerification)
router.post("/forget-password", AuthController.forgetPassword)
router.post("/reset-password", AuthController.resetPassword)
router.post("/change-password", AuthController.changePassword)

module.exports = router;
