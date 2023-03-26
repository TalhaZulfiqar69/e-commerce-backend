const express = require('express');
const router = express.Router();
const authRouter = require('./auth');
const categoryRouter = require('./categories');
const subcategoryRouter = require('./subCategories');
const productsRouter = require('./products');

/* GET default server response. */
router.get('/', function (req, res) {
  res.status(200).json({
    status: 200,
    success: true,
    message: 'Welcome to Backend APIs',
    data: {},
  });
});

router.use('/auth', authRouter); // Auth routes
router.use('/categories', categoryRouter); // Categories routes
router.use('/subcategories', subcategoryRouter); // Sub Categories routes
router.use('/products', productsRouter); // Products routes

module.exports = router;
