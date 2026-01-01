const mongoose = require("mongoose"); 
const imageSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  image: {
    url: String,
    filename: String
  }
});

module.exports = mongoose.model("Image", imageSchema);