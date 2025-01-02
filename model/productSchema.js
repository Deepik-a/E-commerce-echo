const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Correctly placed for 'name' field
    },
    stock: {
        type: Number,
        required: true // Correctly placed for 'stock' field
    },
    price: {
        type: Number,
        required: true // Correctly placed for 'price' field
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Reference to Category model
        required: true // Correctly placed for 'category' field
    },
    imgArray: {
        type: [String],
        default: [],
    },
    description: {
        type: String,
        required: true, // Correctly placed for 'description' field
    },
    discount: {           
    type: Number,
    default: 0   // Discount amount (percentage or flat amount
    },
    finalPrice: { 
     type: Number,
    },
    isActive: {
        type: Boolean,
        default: true
    },
        }, { timestamps: true });

module.exports = mongoose.model("products", schema);
