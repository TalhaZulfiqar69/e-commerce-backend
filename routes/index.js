const express = require('express');
const router = express.Router();
const authRouter = require('./users');

/* GET default server response. */
router.get('/', function (req, res) {
    res.status(200).json({
        status: 200,
        success: true,
        message: 'Welcome to Backend APIs',
        data: {},
    });
});

router.use('/api/admin', authRouter); // Auth routes

module.exports = router;
