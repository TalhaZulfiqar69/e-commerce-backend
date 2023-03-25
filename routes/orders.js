const express = require('express');
const router = express.Router();

const SubCategoryController = require("../controllers/subcategory.controller");

router.get("/", SubCategoryController.getAllSubCategories);
router.post("/", SubCategoryController.createSubCategory)
router.get("/:id", SubCategoryController.findSubCategory)
router.put("/", SubCategoryController.updateSubCategory)
router.delete("/", SubCategoryController.deleteSubCategory)

module.exports = router;
