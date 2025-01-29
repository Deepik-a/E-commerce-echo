const express=require('express')
const admin=express.Router()
const adminController=require('../controller/adminController/adminController')
const userController=require('../controller/adminController/usercontroller')
const categoryController = require('../controller/adminController/categoryController');
const  productController = require('../controller/adminController/productController');
const uploads = require('../middleware/multer');
const couponController = require('../controller/adminController/couponController');
const orderController = require('../controller/adminController/orderController');
const offerController = require('../controller/adminController/offerController');
const  saleController=require('../controller/adminController/salesController')
const  admincontroller=require('../controller/adminController/admindetails')

const isAdmin = require('../middleware/adminSession');



//--------------------------------admin login----------------------------
admin.get('/login',adminController.admin)
admin.post('/login',adminController.adminloginpost)
admin.get('/logout',isAdmin,adminController.logout)
admin.get('/enterdashboard',isAdmin,adminController.getdashboard)



//--------------------------------UserManagment----------------------------
admin.get('/users',isAdmin,adminController.listuser)
admin.get('/block/:id',isAdmin,adminController.blockUser)
admin.get('/unblock/:ideee',isAdmin,adminController.unblockUser)


//--------------------------------CategoryManagment----------------------------
admin.get('/addCategory', isAdmin,adminController.getCategories);
admin.post('/addCategory', isAdmin,categoryController.addCategory);
admin.get('/editCategory',isAdmin,categoryController.geteditCategories);
admin.post('/editCategory/:id',isAdmin,categoryController.editCategory);
admin.post('/categories/:id/block',isAdmin,categoryController.blockCategory);
admin.post('/categories/:id/unblock',isAdmin,categoryController.unblockCategory);
admin.get('/categories', isAdmin,categoryController.getCategoriesForUser);



//--------------------------------ProductManagment----------------------------
admin.get('/products',isAdmin, productController.getAllProducts);
admin.get('/addproduct',isAdmin, productController.getAddProduct);
admin.post('/addproduct',isAdmin, uploads, productController.postAddProduct);
admin.post('/products/:id/block',isAdmin, productController.BlockUnblock);
admin.get('/updateproduct/:id',isAdmin, productController.getUpdateProduct);
admin.post('/updateproduct/:id',isAdmin, uploads, productController.postEditProduct);



//------------------------------------------ order Management-----------------------------------------------------

admin.get('/orders',isAdmin,orderController.listOrders);
admin.post('/orders/status',orderController.changeOrderStatus);
admin.get('/viewReason/:orderId/:productId',isAdmin,orderController.viewReturnReason);
admin.post('/processReturn/:orderId/:productId',orderController.postViewReason)
admin.get('/orders/:id',orderController.viewOrderDetails)


//------------------------------------------ Coupon Management-----------------------------------------------------

admin.get('/coupons/:id?',  couponController.getCoupons);
admin.post('/addcoupon',  couponController.addCoupon);
admin.post('/editcoupon/:id',  couponController.editCoupon);
admin.get('/statuscoupon',  couponController.toggleCouponStatus);
admin.delete('/deletecoupon/:id',  couponController.deleteCoupon);


//-------------------------------- Offer Management---------------------------------

admin.get('/offer-management',isAdmin, offerController.getOffers);
admin.post('/offer-management',isAdmin, offerController.addOffer);
admin.put('/offer-management/:offerId',isAdmin, offerController.editOffer);
admin.post('/offer/:offerId/block',isAdmin, offerController.blockUnblock);
admin.delete('/offer-management/:offerId',isAdmin, offerController.deleteOffer);


//------------------------------------------sales-----------------------------------------------------

admin.get('/salesReport',isAdmin,saleController.sales)
admin.get('/exportReport',isAdmin,saleController.exportReport)

//------------------------------------------dashboard-----------------------------------------------------
admin.get('/dashboard',isAdmin,adminController.dashboard);
admin.post('/dashboard',isAdmin,adminController.dashboard);
admin.get('dasboardFilter',isAdmin,adminController.dashboardFilter)

//admin.post('/Dashboard',isAdmin,admincontroller.loginPost)
admin.get('/gotodash',isAdmin,admincontroller.dashboardGet)



module.exports=admin