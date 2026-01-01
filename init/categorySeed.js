const mongoose = require("mongoose");
const Image = require("../models/image");
const categoryData = require("./categoryData");

const MONGO_URL = "mongodb://127.0.0.1:27017/majorproject";

async function seedCategory() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Clear the old data that has no prices
    await Image.deleteMany({}); 

    // Insert the fresh data from categoryData.js
    await Image.insertMany(categoryData);

    console.log("SUCCESS: Data with Prices inserted!");
  } catch (err) {
    console.log("Error:", err);
  } finally {
    await mongoose.connection.close();
  }
}

seedCategory();