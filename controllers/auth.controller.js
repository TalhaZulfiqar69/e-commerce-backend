const Sequelize = require('sequelize');
const ResponseHelper = require('../helpers/response_helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const models = require('../models/index');
const sequelize = require('../config/database');
const { validationResult, matchedData } = require('express-validator');
const { generateHashPassword } = require('../helpers/helper.js');
const {
  createAccountMessageHelper,
  forgetPasswordMessageHelper,
} = require('../helpers/email_message_helper.js');
const {
  OK_STATUS_CODE,
  BAD_REQUEST_STATUS_CODE,
} = require('../helpers/status_codes.js');

class AuthController {
  /**
   * @param req request body
   * @param res callback response object
   * @description Method to login
   * @date 15 March 2023
   * @updated 15 March 2023
   */
  static login = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      BAD_REQUEST_STATUS_CODE
    );
    const t = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        response.message = validationErrors[0].msg;
      }

      const { email, password } = matchedData(req);
      const user = await models.User.findOne({
        exclude: ['password'],
        where: { email: email },
      });

      if (!user?.dataValues?.is_verified)
        return (response.message =
          'Account not verified. Please verify your account to continue.');

      const verifyPassword = bcrypt.compareSync(
        password,
        user?.dataValues.password
      );

      if (!verifyPassword) return (response.message = 'Password is incorrect.');

      const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET_STRING,
        { expiresIn: '1h' }
      );

      const login_user = { ...user?.dataValues, token };

      response.success = true;
      response.message = 'Login successfully.';
      response.data = login_user;
      response.status = OK_STATUS_CODE;
    } catch (err) {
      await t.rollback();
      console.log('error', err);
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to register
   * @date 15 March 2023
   * @updated 15 March 2023
   */
  static register = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    const t = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        response.message = validationErrors[0].msg;
      } else {
        const validatedData = matchedData(req);

        const hashedPassword = generateHashPassword(validatedData?.password);
        if (hashedPassword) {
          const user = await models.User.create(
            {
              email: validatedData?.email,
              password: hashedPassword,
              firstName: validatedData?.firstName,
              lastName: validatedData?.lastName,
              contact: validatedData?.contact,
              address: validatedData?.address,
            },
            { transaction: t }
          );

          const verificationToken = jwt.sign(
            { email: user?.dataValues?.email },
            process.env.JWT_SECRET_STRING,
            { expiresIn: '1h' }
          );

          const email_delivered = await createAccountMessageHelper(
            user,
            verificationToken
          );

          if (!email_delivered?.messageId) {
            t.rollback();
            return (response.message = email_delivered?.message);
          }
          if (!user) return await t.rollback();
          response.success = true;
          response.message =
            'Account created successfully. Please check your email to verify your account and to continue';
          response.status = OK_STATUS_CODE;
          await t.commit();
        }
      }
    } catch (err) {
      await t.rollback();
      console.log('error', err);
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to getUserProfile
   * @date 25 March 2023
   * @updated 25 March 2023
   */
  static getUserProfile = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    const t = await sequelize.transaction();
    try {
      const authenticationToken = req.headers.authorization.split(' ')[1];
      if (!authenticationToken)
        response.message = 'Authentication token is required.';

      const verifyToken = await jwt.verify(
        authenticationToken,
        process.env.JWT_SECRET_STRING
      );

      if (!verifyToken) response.message = 'Invalid authorization token.';

      const user = await models.User.findOne({
        attributes: {
          exclude: ['password'],
        },
        email: verifyToken?.email,
      });
      if (!user) response.message = 'User not found.';

      response.success = true;
      response.message = 'User information.';
      response.data = user;
      response.status = 200;
    } catch (err) {
      response.message = err?.message;
      response.status = 400;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to accountVerification
   * @date 25 March 2023
   * @updated 25 March 2023
   */
  static accountVerification = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    const t = await sequelize.transaction();
    try {
      const authenticationToken = req.headers.authorization.split(' ')[1];
      if (!authenticationToken)
        return (response.message = 'Authentication token is required.');

      const verifyToken = await jwt.verify(
        authenticationToken,
        process.env.JWT_SECRET_STRING
      );

      if (!verifyToken) return (response.message = 'Token is expired.');

      const user = await models.User.findOne({
        where: { email: verifyToken?.email },
      });

      if (!user) return (response.message = 'Invalid token provided.');

      const verifyAccount = await models.User.update(
        { is_verified: true },
        { where: { email: user?.email } },
        { transaction: t }
      );

      if (!verifyAccount) {
        t.rollback();
        return (response.message = 'Account not verified.');
      }

      response.success = true;
      response.message = 'Account verified successfully.';
      response.status = 200;
      t.commit();
    } catch (err) {
      await t.rollback();
      console.log('error', err);
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to forgetPassword
   * @date 15 March 2023
   * @updated 15 March 2023
   */
  static forgetPassword = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        return (response.message = validationErrors[0].msg);
      }
      const validatedData = matchedData(req);
      const { email } = validatedData;

      const user = await models.User.findOne({
        where: { email: email },
      });

      if (!user)
        return (response.message =
          'This email does not belong to any account.');

      const verificationToken = jwt.sign(
        { email: user?.dataValues?.email },
        process.env.JWT_SECRET_STRING,
        { expiresIn: '1h' }
      );

      const email_delivered = await forgetPasswordMessageHelper(
        user,
        verificationToken
      );

      if (!email_delivered?.messageId)
        return (response.message = email_delivered?.message);

      response.success = true;
      response.message =
        'Forget password instructions send to you inbox. Please check your the instructions to reset your password.';
      response.status = OK_STATUS_CODE;
    } catch (err) {
      console.log('error', err);
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to resetPassword
   * @date 15 March 2023
   * @updated 15 March 2023
   */
  static resetPassword = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    const t = await sequelize.transaction();
    try {
      const authenticationToken = req.headers.authorization.split(' ')[1];
      if (!authenticationToken)
        return (response.message = 'Authentication token is required.');

      const verifyToken = await jwt.verify(
        authenticationToken,
        process.env.JWT_SECRET_STRING
      );

      if (!verifyToken)
        return (response.message = 'Invalid authorization token.');

      const user = await models.User.findOne({
        email: verifyToken?.email,
      });

      if (!user) response.message = 'Invalid token provided.';

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        return (response.message = validationErrors[0].msg);
      }

      const validatedData = matchedData(req);
      const { password } = validatedData;

      const hashedPassword = generateHashPassword(password);

      const updateUserPassword = await models.User.update(
        { password: hashedPassword },
        { where: { email: user?.email } },
        { transaction: t }
      );
      if (!updateUserPassword) {
        t.rollback();
        return (response.message =
          'Something is going wrong while setting new pasword');
      }

      t.commit();
      response.success = true;
      response.message = 'Password changed successfully.';
      response.status = 200;
    } catch (err) {
      await t.rollback();
      console.log('error', err);
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };

  /**
   * @param req request body
   * @param res callback response object
   * @description Method to changePassword
   * @date 15 March 2023
   * @updated 15 March 2023
   */
  static changePassword = async (req, res) => {
    let response = ResponseHelper.getResponse(
      false,
      'Something went wrong',
      {},
      400
    );
    const t = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      const authenticationToken = req.headers.authorization.split(' ')[1];
      const verifyToken = await jwt.verify(
        authenticationToken,
        process.env.JWT_SECRET_STRING
      );

      if (!verifyToken) return (response.message = 'Invalid token');

      const user = await models.User.findOne({
        where: { email: verifyToken?.email },
      });

      if (!user) return (response.message = 'User not found');

      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        return (response.message = validationErrors[0].msg);
      }
      const validatedData = matchedData(req);
      const { password, oldPassword } = validatedData;

      const verifyOldPassword = bcrypt.compareSync(
        oldPassword,
        user?.dataValues.password
      );
      if (!verifyOldPassword)
        return (response.message = 'Old password is incorrect');

      const hashedPassword = generateHashPassword(password);

      const updateUserPassword = await models.User.update(
        {
          password: hashedPassword,
        },
        { where: { email: verifyToken?.email } },
        { transaction: t }
      );

      if (!updateUserPassword)
        return (response.message = 'something is going wrong');

      await t.commit();
      response.status = 200;
      response.success = true;
      response.message = 'Password changed successfully.';
    } catch (err) {
      await t.rollback();
      response.message = err?.message;
      response.status = 500;
    } finally {
      return res.status(response.status).json(response);
    }
  };
}

module.exports = AuthController;
