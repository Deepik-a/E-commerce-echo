const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
    title: { type: String },
    discountPercentage: { type: Number,  min: 0, max: 100 },
    applicableProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'products'},
    applicableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    offerType: { type: String, enum: ['products', 'Category'] },
    startDate: { type: Date},
    endDate: { type: Date},
    isActive: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);


