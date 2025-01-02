const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'echoemporium2',  // Assuming this is your User model
        required: true
    },
    products: [
        {
            productID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products",
                required: true
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('wishlist', wishlistSchema);
