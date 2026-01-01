const mongoose = require("mongoose");
const Listing = require("../models/listing");
const initData = require("./data");
const MONGO_URL = "mongodb://127.0.0.1:27017/majorproject";

async function restoreWanderlust() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    await Listing.deleteMany({}); // Clears any partial or broken data
    
    // Process data to match schema requirements
    const processedData = initData.data.map((obj) => ({
      ...obj,
      owner: "6939b6f381cb151419ab85e0", // Required owner ID
      // Geometry is required by schema
      geometry: obj.geometry || { type: "Point", coordinates: [0, 0] } 
    }));

    await Listing.insertMany(processedData);
    console.log("Wanderlust data restored successfully!");
  } catch (err) {
    console.log("Restoration Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

restoreWanderlust();