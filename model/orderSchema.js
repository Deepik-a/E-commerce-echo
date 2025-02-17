const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'echoemporium2', // Reference to the User collection
        required: true
    }, 
    orderId: {
        type: Number, // Optionally, you can use a unique order number generator
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products', // Reference to the Products collection
            required: true
        },
        productCount: {
            type: Number,
            required: true
        },
        productPrice: {
            type: Number,
            required: true
        },
        productImage: {
            type: String,
        },   
        productName:{
            type:String
        },
        productCategory:{
            type:String
        },
        productDiscount: {
            type: Number
        },  
        // Add individual status for each product
        status: {
            type: String,
            enum: ['Paid','Shipped', 'Pending', 'Delivered', 'Returned', 'Cancelled','Requested','Rejected'],
            default: 'Pending' // Default status for individual product
        },
        reasonForCancellation:{
            type:'String'
        },
        reasonForReturn:{
            type:'String'
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalQuantity: {
        type: Number,
        default: 0, // Optional: Can be calculated dynamically
    },
    address: {
        type: String,
        required: true
    },
    isCancel: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Razorpay', 'Wallet'], // Valid payment methods
    },
    paymentId: {
        type: String,
        required: false, // Only required if payment method is Razorpay or wallet
    },
    paymentStatus: {
        type: String,
        required: false, // Only required if payment method is Razorpay or wallet
    },
     payableAmount:{
            type:Number,
            default:0
        },
    couponCode: {
        type: String,
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Paid', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending' // Default status when the order is placed
    },
    paid:{
        type:Boolean,
        default:false
    },
    deliveryDate: {
        type: Date,
        required: false, // Optional field to capture delivery date
    }
},

{
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Calculate totalQuantity dynamically
orderSchema.methods.calculateTotalQuantity = function() {
    this.totalQuantity = this.items.reduce((acc, item) => acc + item.productCount, 0);
};

// Update order status based on payment method and status
orderSchema.pre('save', function(next) {
    if (this.paymentMethod === 'Razorpay' && this.paymentStatus === 'Paid') {
        this.status = 'Paid'; // Set the order status to 'Paid' if Razorpay is used and payment is successful
    }
    next();
});

orderSchema.pre('save', async function(next) {
    // Iterate through each item to find if any has status 'Delivered'
    const deliveredItems = this.items.filter(item => item.status === 'Delivered');

    if (deliveredItems.length > 0 && !this.deliveryDate) {
        this.deliveryDate = new Date(); // Set the delivery date when at least one item's status is 'Delivered'
    }

    next();
});



module.exports = mongoose.model('orders', orderSchema);


