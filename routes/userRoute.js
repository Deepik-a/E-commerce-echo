const express=require('express')
const route=express.Router()
const passport = require('passport');


const activeUser = require('../middleware/userSession');
const checkUser= require('../middleware/checkUserSession');
const loadCategoriesMiddleware = require('../middleware/setCategoryinLocals')

// load categories to navbar2
route.use(loadCategoriesMiddleware);


const userController=require("../controller/userController/userController")
const User=require("../model/userSchema")
const productController=require("../controller/userController/productController")
const categoryController=require("../controller/userController/categoryController")
const profileController=require('../controller/userController/profileController')
const cartController=require('../controller/userController/cartController')
const navbarController=require('../controller/userController/navbarcontroller')
const categorySchema=require('../model/categorySchema')
const productSchema=require('../model/productSchema')
const checkOutController=require('../controller/userController/checkoutcontroller')
const forgotPassword=require('../controller/userController/forgotPassword')
const walletController=require('../controller/userController/walletController')
const orderController=require('../controller/userController/orderController')
const wishlistController=require('../controller/userController/wishlistcontroller')
const pdfController = require('../controller/userController/pdfController')




//-------------------------------- home -------------------------------

route.get('/' ,checkUser,navbarController.home);

/*-------------------------------------signup-----------------*/
route.get('/signup',checkUser,userController.signup)
route.post('/signup',checkUser,userController.signupPost)


route.get('/otp',checkUser,userController.otp)
route.post('/otp',checkUser,userController.otppost)

route.get('/resend',checkUser,userController.otpResend)


route.get('/login',checkUser,userController.login)

route.post('/login',checkUser,userController.loginpost)

route.get('/logout',checkUser,userController.logout)
//------------------------ login using google ------------------------


// route.get('/auth/google/callback',userController.googleAuthCallback);
route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route

const MongoServerError = require('mongodb').MongoServerError;
route.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      const categories = await categorySchema.find({ isDeleted: false });
      const products = await productSchema.find({ isActive: true });

      // Attempt to find an existing user by email
      let user = await User.findOne({ email: req.user.email });

      if (!user) {
        // If user doesn't exist, create a new user
        try {
          user = await User.create({
            email: req.user.email,
            name: req.user.name,  // Assuming `name` is part of the Google profile
          });
        } catch (err) {
        
          // Handle duplicate key error
          if ( err.code === E11000) {
               // Duplicate email error: User already exists
           console.log(`Duplicate email error: ${req.user.email}`)
            // Pass the error message to the view explicitly
            return res.render('user/login', { error: 'This email is already associated with an existing account. Please log in.' });
          }
            // If any other error occurs, throw the error
            console.log(err);
          throw err; // Throw other errors to be caught by the outer catch block
        }
      }

      if (user.isBlocked) {
        return res.render('user/signup', { message: 'Your account has been blocked' });
      }

      // Set session for the authenticated user
      req.session.user = user._id;

      // Render the landing page with user details
      res.render('user/Landingpage', { categories, products, user });
    } catch (error) {
      console.error(`Error during Google OAuth callback: ${error.message}`);
      res.redirect('/'); // Redirect to home on error
    }
  }
);






// //---------------------------------- Cart ------------------------

route.post('/cart/add/:id/:finalPrice',checkUser,cartController.addToCart);
route.get('/cart',checkUser, cartController.getCart);
route.get('/cart/remove/:id', checkUser ,cartController.removeFromCart);
route.post('/cart/increment',checkUser ,cartController.increment);
route.post('/cart/decrement',checkUser ,cartController.decrement);


// //---------------------------------- wishlist------------------------

// route.get('/wishlist',wishlistController.wishlistPage)



// //---------------------------------- Order  ------------------------







//------------------------------- Wishlist ---------------------------

route.get('/wishlist', checkUser, wishlistController.wishlistpage );

route.post('/add-wishlist/:id', checkUser, wishlistController.addWishlist );

route.post('/delete-wish/:id', checkUser , wishlistController.deleteWishlist );



//---------------------------------- Category and main page------------------------
// route.get('/categories', checkUser ,categoryController.getAllCategories);
route.get('/product/:id', checkUser ,productController.getProductDetail)
route.get('/all-products', checkUser ,productController.getAllProducts);
route.get('/products',checkUser,productController.sortAllproducts)
route.get('/product/zoom/:id',productController.imageZoom)
route.get('/categories/:categoryName',checkUser , productController.getProductsByCategory);
route.post('/search',checkUser,productController.searchbyProducts)


 //--------------------------------UserProfile----------------------------
route.get('/userprofile',checkUser,profileController.profile)
route.post('/update-profile',  checkUser,profileController.updatedProfile);
route.post('/add-address',checkUser, profileController.addAddress);
route.post('/delete-address/:index',checkUser,profileController.removeAddress)
route.post('/edit-address/:index',checkUser,profileController.editAddress)



//----------------------------- wallet route --------------------------

route.get('/wallet', checkUser, walletController.walletPage);




//----------------------------- checkout --------------------------
route.get('/checkout',checkUser,checkOutController.getCheckoutPage); 
route.get('/checkout/validate',checkUser,checkOutController.validateCheckout)
route.get('/failed-order',checkUser,checkOutController.failedOrder)
route.post('/place-order/:address/:payment',checkOutController.placeOrder)
route.get('/conform-order',checkUser,checkOutController.orderConformPage)
route.get('/orders',orderController.orderPage)
//--------------------------------------Razorpay----------------------------------

route.post('/payment-render/:amount',checkOutController.paymentRender)

//--------------------------------------Coupon----------------------------------

route.post('/applyCoupon',checkOutController.applyCoupon)
route.post('/removeCoupon',checkOutController.removeCoupon)
route.get('/coupons',checkUser,checkOutController.userCoupons)



//----------------------------------order page-------------------
route.get('/orders/:id',orderController.viewOrderDetails)
route.get('/orders/dowload-pdf/:orderId',pdfController.generateOrderPDF)
route.post('/cancelOrder/:id',orderController.cancelOrder);


//------------------------- forgot password ---------------------------

route.get('/forgotpassword' , forgotPassword.forgotPassword);
route.post('/forgotpassword' , forgotPassword.forgotPasswordPost);
route.get('/forgotpasswordotp' , forgotPassword.forgotPasswordOtp);
route.post('/forgotpasswordotp' , forgotPassword.forgotPasswordOtpPost);
route.post('/resetpassword' , forgotPassword.resetPasswordPost);
route.get('/forgotpassword-resend/:email' , forgotPassword.forgotResend);

module.exports = route;