

const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const Wallet = require('../../model/walletSchema');
const User = require('../../model/userSchema');
exports.listOrders = async (req,res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    try {

        const totalOrders = await Order.countDocuments(); 
        const orders = await Order.find().sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(limit)
        .populate('userId')
        .populate('items.productId')
        
        res.render('admin/order',{
            orders,
            currentPage:page,
            totalPages:Math.ceil(totalOrders/limit)
        })
    } catch (error) {
       console.log(`error from adminOrder ${error}`) 
    }
}


exports.changeOrderStatus = async (req, res) => {
    const { orderId, productId, status } = req.body;
    console.log("req.body from changeorderstatus",req.body)

    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.json({ success: false, error: "Order not found" });
        }
        
        // Find the product within the order and update its status
        const item = order.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return res.json({ success: false, error: "Product not found in the order" });
        }
        
        item.status = status;
       if(item.status == 'Delivered'){
        order.status = 'Pending'
       }    

        console.log(`product Status = ${item.status}`)
        await order.save();
        
        return res.json({ success: true });
    } catch (error) {
        console.error("Error updating status:", error);
        return res.json({ success: false, error: "Failed to update status" });
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

exports.viewReturnReason = async (req,res) =>{
    try {
        const {orderId,productId} = req.params;
        const order = await Order.findById(orderId).populate('items.productId');

        const item = order.items.find(item => item.productId._id.toString() === productId);

        if(item&&item.reasonForReturn){
            res.render('admin/returnReason', { order, item, reasonForReturn: item.reasonForReturn });
        }else{
            res.status(404).send('Return reason not found or item does not exist.');
        }
    } catch (error) {
       console.log(`error from viewReturnReason ${error}`) 
       res.status(500).send('Error retrieving order details');
    }
}


exports.postViewReason = async (req, res) => {
    const { orderId, productId } = req.params;
    const { action } = req.body;
    console.log(`action = ${action}`);

    try {
        const order = await Order.findById(orderId);
        const userId = await User.findById(order.userId);
        const item = order.items.find(item => item.productId.toString() === productId);

        console.log(`item = ${JSON.stringify(item)}`);

        if (item) {
            let refundAmount = item.productPrice * item.productCount;

            // If action is 'approve', credit the refund amount for the returned product to the wallet
            if (action === 'approve') {
                item.status = 'Returned';

                // Apply coupon discount to the refund amount proportionally (if applicable)
                if (order.couponCode && order.couponDiscount > 0) {
                    const totalProducts = order.items.length;
                    const couponDiscountPerProduct = order.couponDiscount / totalProducts;
                    const couponDiscountApplicable = couponDiscountPerProduct * item.productCount;

                    refundAmount -= couponDiscountApplicable;  // Adjust refund amount by coupon
                    console.log(`refundAmount after coupon adjustment: ₹${refundAmount}`);
                }

                // Handle Wallet credit
                const userWallet = await Wallet.findOne({ userID: userId });

                if (userWallet) {
                    // Add refund amount to wallet
                    userWallet.balance = (userWallet.balance || 0) + refundAmount;
                    userWallet.transaction.push({
                        wallet_amount: refundAmount,
                        order_id: order.orderId,
                        transactionType: 'Credited',
                        transaction_date: new Date()
                    });
                    await userWallet.save();
                } else {
                    await Wallet.create({
                        userID: order.userId,
                        balance: refundAmount,
                        transaction: [{
                            wallet_amount: refundAmount,
                            order_id: order.orderId,
                            transactionType: 'Credited',
                            transaction_date: new Date()
                        }]
                    });
                }

                console.log('Refund credited to wallet');
            } else if (action === 'reject') {
                item.status = 'Rejected';
                console.log('Product rejection status updated');
            } else {
                return res.status(400).send('Invalid action');
            }
        } else {
            return res.status(404).send('Item not found');
        }

        await order.save();
        res.redirect('/admin/orders');
    } catch (error) {
        console.log(`error from postViewReason: ${error}`);
        res.status(500).send('Internal Server Error');
    }
};
