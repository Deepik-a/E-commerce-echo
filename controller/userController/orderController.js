

const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema')
const Wallet = require('../../model/walletSchema')
const Razorpay =  require('razorpay');
const Cart = require('../../model/cartSchema')
require('dotenv').config();


//--------------------------------- user order page -----------------------------


exports.orderPage = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }

        // Get the current page number from the query parameters, default to 1
        const page = parseInt(req.query.page) || 1;
        const limit =5; // Set the number of orders to display per page
        const skip = (page - 1) * limit;

        // Fetch orders with pagination
        const orderDetails = await Order.find({ userId: user })
            .populate("items.productId")
            .sort({ updatedAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get total count of orders for pagination
        const totalOrders = await Order.countDocuments({ userId: user });
        console.log("totalordes",totalOrders)
        const totalPage = Math.ceil(totalOrders / limit);
        console.log("totalPage",totalPage)
// console.log(orderDetails+"order details");



        res.render("user/order", {
            title: "Orders",
            user,
            orderDetails,
            currentPage: page,
            totalPage,
            limit,
        });
    } catch (err) {
        console.error(`Error rendering the order page: ${err}`);
        req.flash("error", "Error rendering the order page, please Try again later.");
        res.redirect("/");
    }
};

exports.viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('items.productId').exec();
         
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
    
       
        res.json(order);
    } catch (error) {
        console.error(`Error from viewOrderDetails: ${error}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const razorpay = new Razorpay({
    key_id: "rzp_test_KDYrLJHnu3O9Ip", // Your Razorpay key_id
    key_secret: "bcOjtnHN19lrbqBWdS35Ee7J" // Your Razorpay key_secret
});





exports.cancelOrder = async (req,res) => {
    try {
console.log('hai')
     const orderId = req.params.id;
    
        const {action,reason,productId} = req.body;
        console.log(`action = ${action}`)   
 
        if(!productId){
            return res.json({ success: false, message: 'Invalid order ID' });
        }
        const order = await Order.findById(orderId);
        order.status='Cancelled'
            
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }
       if(action == 'cancel'){
        if(order.paid){
            if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet' ) {
                const userWallet = await Wallet.findOne({ userID: order.userId });
                if (userWallet) {
                    userWallet.balance = (userWallet.balance || 0) + order. payableAmount;
                    userWallet.transaction.push({
                        wallet_amount: order. payableAmount,
                        order_id: order.orderId,
                        transactionType: 'Credited',
                        transaction_date: new Date()
                    });
                    await userWallet.save();
                } else {
                    await Wallet.create({
                        userID: order.userId,
                        balance: order. payableAmount,
                        transaction: [{
                            wallet_amount: order. payableAmount,
                            order_id: order.orderId,
                            transactionType: 'Credited',
                            transaction_date: new Date()
                        }]
                    });
                }
            }
        }
       }
 


const item = order.items.find(item => item.productId.toString() === productId);

if(item){
    item.status = action === 'return'?'Requested':'Cancelled';
    item.reasonForCancellation = action ==='cancel'?reason:null;
    item.reasonForReturn = action === 'return'?reason:null;
}

const product = await Product.findById(productId);

console.log(`product = ${product}`)
if(product){
    product.stock += item.productCount;
    await product.save();
}else{
    return res.json({ success: false, message: 'Product not found in inventory' });
}

console.log(`after = ${product.stock}`)

        
         console.log(`order = ${order}`)
        await order.save();
        return res.json({ success: true });
    } catch (error) {
     console.log(`error form cancelOrder:${error.message}`)
     res.json({ success: false, message: 'Cannot cancel this order right now, please try again' });
    }
}

exports.retryRazorPay = async(req,res) =>{
    try {
        console.log(`hi from retryRazorPay`)
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        console.log(`order = ${order}`)

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.payableAmount * 100),
            currency: "INR",
            receipt: `receipt#${orderId}`
        });

        if (razorpayOrder) {
            return res.status(200).json({
                ...order.toObject(),
                razorpayOrderId: razorpayOrder  
            });
        } else {
            return res.status(500).send('Razorpay order creation failed');
        } 
    } catch (error) {
       console.log(`error from retryRazorPay ${error}`) 
       res.status(500).send('Internal Server Error');
    }
}

exports.retryPayment = async (req,res) =>{
    try {
        const { orderId, paymentId, razorpayOrderId } = req.body;
        const update = {
            paymentId: paymentId,
            paymentStatus: 'Paid',
            orderStatus: 'Pending',
            paid:true
        };
        const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
        if (!order) {
            return res.status(404).send('Order not found');
        }
        for (let product of order.items) {
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { stock: -product.productCount }
            });
        }
        await Cart.deleteOne({ userId:req.session.user_id});
        res.status(200).json(order);
    } catch (error) {
        console.log(`error from retryPayment ${error}`)
        res.status(500).send('Internal Server Error');
    }
}


