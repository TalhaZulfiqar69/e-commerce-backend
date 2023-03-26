const express = require('express');
const router = express.Router();

const {
  loginValidation,
  registrationValidation,
  changePasswordValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
} = require('../helpers/validation_helper');
const AuthController = require('../controllers/auth.controller');

router.post('/login', loginValidation, AuthController.login); // Admin Login api
router.post('/register', registrationValidation, AuthController.register);
router.get('/get-user-profile', AuthController.getUserProfile);
router.post('/account-verification', AuthController.accountVerification);
router.post(
  '/forget-password',
  forgetPasswordValidation,
  AuthController.forgetPassword
);
router.post(
  '/reset-password',
  resetPasswordValidation,
  AuthController.resetPassword
);
router.post(
  '/change-password',
  changePasswordValidation,
  AuthController.changePassword
);

module.exports = router;
