
const User = require('../../model/userSchema');
const Cart = require('../../model/cartSchema');
const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const Coupon = require('../../model/couponSchema')
const Wallet = require('../../model/walletSchema')

const  Razorpay = require('razorpay');
const { concurrency } = require('sharp');
const orderSchema = require('../../model/orderSchema');
const Category = require('../../model/categorySchema');

//checkout validation
exports.validateCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'User not found, please log in again.' });
        }

        const userId = req.session.user;

        const cartDetails = await Cart.findOne({ userId })
        .populate({
            path: 'items.productId',
            populate: {
                path: 'category',
                match: { isDeleted: false } // Filter products whose category is not deleted
            }
        });
    
    if (!cartDetails) {
        return res.status(404).send('Cart not found');
    }
    
    
    const items = cartDetails.items;
    if (items.length === 0) {
        return res.redirect('/cart');
    }
    
    // Remove products that belong to deleted categories and redirect if any such product is found
    const validItems = items.filter(item => {
        if (item.productId.category === null || (item.productId.category && item.productId.category.isDeleted)) {
            return false; // Exclude items from deleted categories
        }
        return true;
    });
    
    
    console.log("category deleted",validItems)
    
    if (validItems.length === 0) {
                     return res.status(400).json({ success: false, message: `Category is not available right now.` });
    }
    
      // Remove products that are InActive
        for (const item of items) {
            const product = item.productId;
            if (!product.isActive) {
                return res.status(400).json({ success: false, message: `Product "${product.name}" is not available.` });
            }

            if (item.productCount > product.stock) {
                return res.status(400).json({ success: false, message: `The quantity of "${product.name}" exceeds the available stock.` });
            }
        }

        // If all checks pass 
        res.status(200).json({ success: true, message: 'Validation successful' });
    } catch (error) {
        console.error('Error during checkout validation:', error);
        res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
    }
};



//after validation,get the checkout page
exports.getCheckoutPage = async (req,res) => {
    try {
   
        if (!req.session.user) {
            return res.redirect('/login');
        }
      
      const userId = req.session.user;
      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).send('User not found');
    }
    
    const cartDetails = await Cart.findOne({ userId })
    .populate({
        path: 'items.productId',
        populate: {
            path: 'category',
            match: { isDeleted: false } // Filter products whose category is not deleted
        }
    });

if (!cartDetails) {
    return res.status(404).send('Cart not found');
}


const items = cartDetails.items;
if (items.length === 0) {
    return res.redirect('/cart');
}

// Remove products that belong to deleted categories and redirect if any such product is found
const validItems = items.filter(item => {
    if (item.productId.category === null || (item.productId.category && item.productId.category.isDeleted)) {
        return false; // Exclude items from deleted categories
    }
    return true;
});


console.log("category deleted",validItems)

if (validItems.length === 0) {
    return res.redirect('/cart'); // Redirect if no valid items remain
}



// If the product is inactive, it redirects to the cart page and there checkout validation is done
for (const item of validItems) {
    if (!item.productId.isActive) {
        return res.redirect("/cart");
    }
}



const availableCoupons = await Coupon.find({
    isActive:true,
    endDate:{$gte:new Date()},
    minimumOrderAmount:{$lte:cartDetails.totalPrice}
});



const eligibleCoupons = availableCoupons.filter((coupon) =>{
   const couponUsage =  user.couponUsed.find((c) =>{
    c.couponId.equals(coupon._id)
   })
   if(couponUsage){
    return couponUsage.usageCount < coupon.usageCount
   }
   return true
});


let wallet = await Wallet.findOne({ userID: userId });



if (!wallet) {
    wallet = { balance: 0, transaction: [] };
}




const addresses = user ? user.address : []

    return res.render('user/checkout',{
        user,
        cartDetails,
        userDetails:user,
        addresses,
        eligibleCoupons,
        wallet
    })


            
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).send('Server Error');
        }
    
}



exports.paymentRender = async (req, res) => {
    try {
        console.log("entered payment render")
        const totalAmounts = req.params.amount;
        const totalAmount=Math.floor(totalAmounts )
        console.log(`Received totalAmount: ${totalAmount}`); 

        if (!totalAmount) {
            console.error('Amount parameter is missing');
            return res.status(404).json({ error: 'Amount parameter is missing' });
        }

        const instance = new Razorpay({
            key_id: "rzp_test_KDYrLJHnu3O9Ip", 
            key_secret: "bcOjtnHN19lrbqBWdS35Ee7J" 
        });

        const options = {
            amount: totalAmount*100,
            currency: 'INR',
            receipt: "receipt#1"
        };

        console.log('Order creation options:', options); 


        //razorpay order craetion
        instance.orders.create(options, (error, order) => {
            if (error) {
                console.error(`Failed to create order:`, error); 
                return res.status(500).json({ error: `Failed to create order: ${error.message}` });
            }

            console.log('Order created successfully:', order); 
            return res.status(200).json({ orderID: order.id });
        });

    } catch (error) {
        console.error(`Error on orders in checkout:`, error); 
        return res.status(500).json({ error: 'Internal server error' });
    }
};




exports.placeOrder = async (req, res) => {
    try {
        console.log("Place Order");

        const userId = req.session.user;
        const addressIndex = parseInt(req.params.address);
        const paymentMode = parseInt(req.params.payment);
        console.log("paymentMode",paymentMode)
        const { razorpay_payment_id, payment_status } = req.body;

        console.log(" payment_status from place order", payment_status)

        // Retrieve the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty or could not be found.' });
        }

        // Validate the user's address
        const user = await User.findById(userId);
        if (!user || !user.address || !user.address[addressIndex]) {
            return res.status(400).json({ success: false, message: 'Selected address is not valid.' });
        }

        // Calculate total quantity of items in the cart
        let totalQuantity = cart.items.reduce((sum, item) => sum + item.productCount, 0);
        const amountToDeduct = cart.payableAmount > 0 ? cart.payableAmount : cart.totalPrice;


        const paymentDetails = ["Cash on Delivery", "Wallet", "Razorpay"];
        console.log("paymentDetails length:", paymentDetails.length)
        if(paymentDetails[paymentMode] === 'Cash on Delivery'){
            console.log("paymentDetails[paymentMode]",paymentDetails[paymentMode])
            if(amountToDeduct > 1000){
          return res.status(400).json({sucess:false,message:'COD below 1000 only.'})
            }
        }
        
        const paymentId = paymentMode === 2 ? razorpay_payment_id : 'RazorPay is not chosen as the payment method';

        const newOrder = new Order({
            userId,
            orderId: Math.floor(Math.random() * 1000000),
            items: cart.items,
            totalQuantity,
            totalPrice: cart.totalPrice,
            couponCode: cart.couponId || null,
            couponDiscount: cart.couponDiscount || 0,
            payableAmount: cart.payableAmount > 0 ? cart.payableAmount : cart.totalPrice, // Ensure payableAmount is set correctly
            address: `${user.address[addressIndex].building}, ${user.address[addressIndex].street}, ${user.address[addressIndex].city}, ${user.address[addressIndex].state}, ${user.address[addressIndex].country}, ${user.address[addressIndex].pincode}`,
            paymentMethod: paymentDetails[paymentMode],
            orderStatus: payment_status === "Pending" ? "Pending" : "Paid",
            paymentId,
            paymentStatus: payment_status,
            isCancelled: false,
            paid: paymentMode !== 0,
        });

        await newOrder.save();
        console.log("newOrder from place order",newOrder)

        // Handle wallet payment
        if (paymentDetails[paymentMode] === 'Wallet') {
            const wallet = await Wallet.findOne({ userID: userId });;
            console.log(" userId ", userId )
            console.log("wallet",wallet)
          
            console.log("cart.payableAmount",amountToDeduct)
            if (!wallet || wallet.balance < amountToDeduct) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
            }

            wallet.balance -= amountToDeduct;
            wallet.transaction.push({
                wallet_amount: amountToDeduct,
                transactionType: 'Debited',
                transaction_date: new Date(),
                order_id: newOrder.orderId,
            });

            await wallet.save();
        }

      
        if (paymentMode !== 0) {
            newOrder.paymentStatus = "Paid";
            newOrder.paid = true;
        }
        await newOrder.save();

        console.log("Updated newOrder", newOrder);


        // Update product stock
        for (let item of cart.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= item.productCount;
                await product.save();
            }
        }

        // Update coupon usage
        if (cart.isCouponApplied && cart.couponId) {
            const coupon = await Coupon.findById(cart.couponId);
            const couponUsage = user.couponUsed.find((usage) => usage.couponId.toString() === coupon._id.toString());

            if (couponUsage) {
                couponUsage.usageCount += 1;
            } else {
                user.couponUsed.push({
                    couponId: coupon._id,
                    usageCount: 1,
                });
            }

            await user.save();
        }

        // Clear the user's cart
        cart.items = [];
        cart.payableAmount = 0;
        cart.isCouponApplied = false;
        cart.couponDiscount = 0;
        cart.couponId = null;
        cart.totalPrice = 0;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Order placed successfully!',
            order: newOrder,
        });
    } catch (error) {
        console.error(`Error during order placement: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
};






exports.applyCoupon = async (req, res) => {
    try {
        console.log("add apply coupon");

        const { couponCode } = req.body;
        console.log("Received couponCode:", couponCode);

        const user = await User.findOne({ _id: req.session.user });
        if (!user) {
            return res.redirect("/login");
        }

        const coupon = await Coupon.findById(couponCode);
        if (!coupon) {
            return res.status(400).json({
                status: "error",
                message: "Coupon not found",
            });
        }

        if (!coupon.isActive) {
            return res.status(400).json({
                status: 'error',
                message: 'Coupon not active',
            });
        }

        if (new Date() > coupon.endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Coupon expired',
            });
        }

        const cart = await Cart.findOne({ userId: req.session.user });
        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found',
            });
        }

        const total = cart.totalPrice;
        if (total < coupon.minimumOrderAmount) {
            return res.status(409).json({
                status: 'error',
                message: "Your order does not meet the minimum purchase requirement. Please add more items to your cart to proceed.",
            });
        }

        let discountedTotal = total;
        let couponDiscount = coupon.discountValue;

    let discountAmount = 0; // Declare discountAmount outside the block

if (coupon.discountType === 'Fixed') {
    discountedTotal = total - couponDiscount;
} else if (coupon.discountType === 'Percentage') {
    // Calculate the discount amount for percentage-based discount
    discountAmount = (coupon.discountValue / 100) * total; 
    console.log("imp from apply coupont b", discountAmount)
    // Apply max discount if specified
    couponDiscount = Math.min(discountAmount, coupon.maxDiscountAmount || discountAmount); 

    discountedTotal = total - couponDiscount;
}

cart.payableAmount = discountedTotal;
cart.isCouponApplied = true;
cart.couponDiscount = couponDiscount;
cart.couponId = couponCode;




        

        await cart.save();

        return res.status(200).json({
            status: 'success',
            message: 'Coupon applied',
            total: discountedTotal,
            couponDiscount,
        });
    } catch (error) {
        console.error(`Error from applyCoupon: ${error.message}`);
        return res.status(500).json({ error: "An error occurred while applying the coupon." });
    }
};


exports.removeCoupon = async (req, res) => {
    try {
        // Check if the user is authenticated
        const user = await User.findOne({ _id: req.session.user });
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "User not authenticated. Please log in."
            });
        }

        // Find the cart for the user
        const cart = await Cart.findOne({ userId: req.session.user });
        if (!cart) {
            return res.status(404).json({
                status: "error",
                message: "Cart not found",
            });
        }

        // If no coupon is applied, return an error
        if (!cart.isCouponApplied) {
            return res.status(400).json({
                status: "error",
                message: "No coupon is applied to the cart.",
            });
        }

        // Reset cart coupon details
        cart.payableAmount = cart.totalPrice; // Reset the payable amount to the total price
        cart.isCouponApplied = false;
        cart.couponDiscount = 0;
        cart.couponId = null;

        // Save the cart with updated details
        await cart.save();

        // Send a successful response with the updated total
        return res.status(200).json({
            status: "success",
            message: "Coupon removed successfully.",
            total: cart.payableAmount, // Send the updated payable amount
        });
    } catch (error) {
        console.error(`Error from removeCoupon: ${error.message}`);
        // Return an error response if something goes wrong
        return res.status(500).json({
            status: "error",
            message: "An error occurred while removing the coupon.",
            error: error.message, // Include the error message for better debugging
        });
    }
};



//to render the coupon page in user side

exports.userCoupons = async (req,res) =>{
    try {
        const categories = await Category.find({isDeleted:false});
        const coupons = await Coupon.find({isActive:true});


        res.render('user/coupons',{
            categories,
            coupons:coupons
        })
    } catch (error) {
        console.log(`error from userCoupons ${error}`)
        return res.status(500).json({
            error:'An error occured while loading1 the coupon page.'
        })
    }
}



exports.failedOrder = async (req, res) => {
    console.log("entered failed order")
    const addressIndex = parseInt(req.query.address); // Ensure this is an integer
    const paymentMethod = req.query.paymentMethod;
console.log("entered failed order addressIndex ",addressIndex)
console.log("entered failed order paymentMethod",paymentMethod)

    try {
        const userId = req.session.user;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Fetch user and validate address
        const user = await User.findById(userId);
        if (!user || !user.address || !user.address[addressIndex]) {
            return res.status(400).json({ error: 'Invalid address selected' });
        }

        // Fetch cart items
        const cartItems = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartItems || cartItems.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate prices safely
        const totalPrices = cartItems.payableAmount > 0 ? cartItems.payableAmount : cartItems.totalPrice // Ensure payableAmount is set correctly
        const discountPrice = cartItems.discountPrice || 0; // Default to 0 if undefined

        // Ensure valid total and discount
        if (isNaN(totalPrices) || isNaN(discountPrice)) {
            return res.status(400).json({ error: 'Invalid price calculation' });
        }         
        // Create new order
        const newOrder = new Order({
            userId: userId,
            orderId: Math.floor(Math.random() * 1000000),
            paid: false,
            items: cartItems.items,
            status: "Pending",
            totalPrice:totalPrices,
            payableAmount: totalPrices,
            couponCode: cartItems.couponId,
            couponDiscount:cartItems.couponDiscount,
        isCouponApplied: cartItems.isCouponApplied,
            address: `${user.address[addressIndex].building}, ${user.address[addressIndex].street}, ${user.address[addressIndex].city}, ${user.address[addressIndex].state}, ${user.address[addressIndex].country}, ${user.address[addressIndex].pincode}`,
            paymentMethod:"Razorpay",
            paymentStatus:"Pending",
            paymentId: null,
            isCancelled: false,
        });

        // Save the order
        await newOrder.save();
        
        // Clear the user's cart
        cartItems.items = [];
        cartItems.payableAmount = 0;
        cartItems.isCouponApplied = false;
        cartItems.couponDiscount = 0;
        cartItems.couponId = null;
        cartItems.totalPrice = 0;
        await cart.save();


        // Render failed order page
        res.render('user/failedOrder');
    } catch (error) {
        console.error(`Error from failedOrder: ${error}`);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};


//order confirmation page

exports.orderConformPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);

        const order = await Order.findOne({ userId }).sort({createdAt : -1}).limit(1)

        res.render('user/conform-order', { order:order });
    } catch (err) {
        console.log(`Error on render in conform order ${err}`);
    }
}