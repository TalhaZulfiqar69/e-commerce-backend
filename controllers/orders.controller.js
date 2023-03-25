const Sequelize = require('sequelize');
const ResponseHelper = require('../helpers/response_helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const models = require('../models/index');
const sequelize = require('../config/database');
const { validationResult, matchedData } = require('express-validator');
// const Op = Sequelize.Op;

class OrdersController {
    /**
     * @param req request body
     * @param res callback response object
     * @description Method to getAllOrders
     * @date 15 March 2023
     * @updated 15 March 2023
     */
    static getAllOrders = async (req, res) => {
    }
}

module.exports = OrdersController;