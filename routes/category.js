const express = require("express");
const Image = require("../models/image");

const router = express.Router();

router.get("/:category", async (req, res) => {
    const { category } = req.params;
    
    const images = await Image.find({ category: { $regex: new RegExp(category, "i") } });
    res.render("category", { category, images });
});

module.exports = router;
