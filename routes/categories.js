const express = require('express');
const router = express.Router();

const CategoryController = require("../controllers/category.controller");

router.get("/", CategoryController.getAllCategories); // Admin Login api
router.post("/", CategoryController.createCategory)
router.get("/:id", CategoryController.findCategory)
router.put("/", CategoryController.updateCategory)
router.delete("/", CategoryController.deleteCategory)

module.exports = router;
