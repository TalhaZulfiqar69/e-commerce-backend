const Sequelize = require('sequelize');
const ResponseHelper = require('../helpers/response_helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const models = require('../models/index');
const sequelize = require('../config/database');
const { validationResult, matchedData } = require('express-validator');
// const Op = Sequelize.Op;
const {generateHashPassword} = require('../helpers/helper.js');
const {OK_STATUS_CODE,BAD_REQUEST_STATUS_CODE} = require('../helpers/status_codes.js');

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
                const user = await models.User.findOne({
                    where: { email: validatedData?.email },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(validatedData?.password, user.password);
                    if (verifyPassword == false) {
                        response.success = false;
                        response.message = "Username of password in incorrect.";
                        response.status = BAD_REQUEST_STATUS_CODE;
                    } else {
                        if (user.is_verified === false) {
                            response.success = false;
                            response.message = "Account not verified. Please verify your account to continue.";
                            response.status = BAD_REQUEST_STATUS_CODE;
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                process.env.JWT_SECRET_STRING,
                                { expiresIn: '1h' }
                            );
                            const login_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                contact: user.contact,
                                address: user.address,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = login_user;
                            response.status = OK_STATUS_CODE;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }

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

                console.log("validatedData :", validatedData)

                const hashedPassword = generateHashPassword(validatedData?.password)
                console.log("hashedPassword :", hashedPassword)
                if (hashedPassword) {
                    const user = await models.User.create({ 
                        email: validatedData?.email,
                        password: hashedPassword,
                        firstName: validatedData?.firstName,
                        lastName: validatedData?.lastName,
                        contact: validatedData?.contact,
                        address: validatedData?.address,
                    }, { transaction: t });


                    if (user) {
                        response.success = true;
                        response.message = "Account created successfully.";
                        response.data = user;
                        response.status = OK_STATUS_CODE;
                        await t.commit()
                    };

                    if(!user) await t.rollback();
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }

    /**
     * @param req request body
     * @param res callback response object
     * @description Method to getUserProfile
     * @date 15 March 2023
     * @updated 15 March 2023
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
            const { password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array();
                response.message = validationErrors[0].msg;
            } else {
                const validatedData = matchedData(req);
                const { email, token, password } = validatedData;
                const user = await models.User.findOne({
                    where: { email: email },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(password, user.password);
                    if (verifyPassword == false) {
                        response.message = MessageHelper.getMessage(
                            'incorrect_password_error',
                            language
                        );
                    } else {
                        if (user.is_verified == 0) {
                            response.message = MessageHelper.getMessage(
                                'account_not_verified_message',
                                language
                            );
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                meducomConfig.custom.jwtSecretString,
                                { expiresIn: '1h' }
                            );
                            const admin_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                user_type: user.user_type,
                                city: user.city,
                                province: user.province,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = admin_user;
                            response.status = 200;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }

    /**
     * @param req request body
     * @param res callback response object
     * @description Method to accountVerification
     * @date 15 March 2023
     * @updated 15 March 2023
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
            const { password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array();
                response.message = validationErrors[0].msg;
            } else {
                const validatedData = matchedData(req);
                const { email } = validatedData;
                const user = await models.User.findOne({
                    where: { email: email, user_type: 'admin' },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(password, user.password);
                    if (verifyPassword == false) {
                        response.message = MessageHelper.getMessage(
                            'incorrect_password_error',
                            language
                        );
                    } else {
                        if (user.is_verified == 0) {
                            response.message = MessageHelper.getMessage(
                                'account_not_verified_message',
                                language
                            );
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                meducomConfig.custom.jwtSecretString,
                                { expiresIn: '1h' }
                            );
                            const admin_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                user_type: user.user_type,
                                city: user.city,
                                province: user.province,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = admin_user;
                            response.status = 200;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }

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
        const t = await sequelize.transaction();
        try {
            const { password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array();
                response.message = validationErrors[0].msg;
            } else {
                const validatedData = matchedData(req);
                const { email } = validatedData;
                const user = await models.User.findOne({
                    where: { email: email, user_type: 'admin' },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(password, user.password);
                    if (verifyPassword == false) {
                        response.message = MessageHelper.getMessage(
                            'incorrect_password_error',
                            language
                        );
                        response.success = fasle;
                        response.message = "Account nor verified. Please verify your account to continue.";
                        response.status = BAD_REQUEST_STATUS_CODE;
                    } else {
                        if (user.is_verified == 0) {
                            response.success = fasle;
                            response.message = "Account nor verified. Please verify your account to continue.";
                            response.status = BAD_REQUEST_STATUS_CODE;
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                process.env.JWT_SECRET_STRING,
                                { expiresIn: '1h' }
                            );
                            const login_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                contact: user.contact,
                                address: user.address,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = login_user;
                            response.status = OK_STATUS_CODE;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }

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
            const { password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array();
                response.message = validationErrors[0].msg;
            } else {
                const validatedData = matchedData(req);
                const { email } = validatedData;
                const user = await models.User.findOne({
                    where: { email: email, user_type: 'admin' },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(password, user.password);
                    if (verifyPassword == false) {
                        response.message = MessageHelper.getMessage(
                            'incorrect_password_error',
                            language
                        );
                    } else {
                        if (user.is_verified == 0) {
                            response.message = MessageHelper.getMessage(
                                'account_not_verified_message',
                                language
                            );
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                meducomConfig.custom.jwtSecretString,
                                { expiresIn: '1h' }
                            );
                            const admin_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                user_type: user.user_type,
                                city: user.city,
                                province: user.province,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = admin_user;
                            response.status = 200;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }
    
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
            const { password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array();
                response.message = validationErrors[0].msg;
            } else {
                const validatedData = matchedData(req);
                const { email } = validatedData;
                const user = await models.User.findOne({
                    where: { email: email, user_type: 'admin' },
                });
                if (user) {
                    const verifyPassword = bcrypt.compareSync(password, user.password);
                    if (verifyPassword == false) {
                        response.message = MessageHelper.getMessage(
                            'incorrect_password_error',
                            language
                        );
                    } else {
                        if (user.is_verified == 0) {
                            response.message = MessageHelper.getMessage(
                                'account_not_verified_message',
                                language
                            );
                        } else {
                            const token = jwt.sign(
                                { email: user.email },
                                meducomConfig.custom.jwtSecretString,
                                { expiresIn: '1h' }
                            );
                            const admin_user = {
                                id: user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                user_type: user.user_type,
                                city: user.city,
                                province: user.province,
                                token: token,
                                created_at: user.created_at,
                                updated_at: user.updated_at,
                            };
                            response.success = true;
                            response.message = "Login successfully.";
                            response.data = admin_user;
                            response.status = 200;
                        }
                    }
                } else {
                    response.message = "This email does not belong to any account.";
                }
            }
        } catch (err) {
            await t.rollback();
            console.log('error', err);
            response.message = "An exception error occured.";
            response.statue = 500;
        } finally {
            return res.status(response.status).json(response);
        }
    }
}

module.exports = AuthController;
