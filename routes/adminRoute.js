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


const isAdmin = require('../middleware/adminSession');



//--------------------------------admin login----------------------------
admin.get('/login',adminController.admin)
// admin.get('/login',adminController.adminlogin)
admin.post('/login',adminController.adminloginpost)



//--------------------------------UserManagment----------------------------
admin.get('/users',isAdmin,adminController.listuser)
admin.get('/block/:id',isAdmin,adminController.blockUser)
admin.get('/unblock/:ideee',isAdmin,adminController.unblockUser)


//--------------------------------CategoryManagment----------------------------
admin.get('/addCategory', isAdmin,adminController.getCategories);
admin.post('/addCategory', isAdmin,categoryController.addCategory);
admin.get('/editCategory',isAdmin,categoryController.geteditCategories);
admin.get('/editCategory/:id',isAdmin,categoryController.renderEditCategoryForm);
admin.post('/editCategory/:id',isAdmin,categoryController.editCategory);
admin.post('/categories/:id/block',isAdmin,categoryController.blockCategory);
admin.post('/categories/:id/unblock',isAdmin,categoryController.unblockCategory);
admin.get('/categories', isAdmin,categoryController.getCategoriesForUser);


// //--------------------------------ProductManagment----------------------------
//admin.get('/addProduct', isAdmin,productController.getProduct);
// admin.post('/addProduct', multerUpload,productController.addProduct);
// admin.post('/addProduct',isAdmin,productController.addProduct);
//admin.get('/editProduct', isAdmin,productController.geteditProduct);
// admin.post('/editProduct/:id',isAdmin, productController.editProduct);
// admin.delete('/remove-image',isAdmin,productController.Imageremove)
//admin.post('/listProduct/:id', isAdmin,productController.listProduct);
//admin.post('/unlistProduct/:id',isAdmin, productController.unlistProduct);
//admin.post('/products/:id/block',isAdmin,productController.BlockUnblock);
//admin.get('/updateproduct/:id',isAdmin,productController.getUpdateProduct);
//admin.post('/updateproduct/:id',isAdmin,uploads,productController.postEditProduct);

// --- Product Management ---
admin.get('/products',isAdmin, productController.getAllProducts);
admin.get('/addproduct',isAdmin, productController.getAddProduct);
admin.post('/addproduct',isAdmin, uploads, productController.postAddProduct);
admin.post('/products/:id/block',isAdmin, productController.BlockUnblock);
admin.get('/updateproduct/:id',isAdmin, productController.getUpdateProduct);
admin.post('/updateproduct/:id',isAdmin, uploads, productController.postEditProduct);


//--------------------------------Order Management Routes----------------------------


// admin.get('/orders', orderController.listOrders);
// admin.post('/orders/item-status',orderController.changeProductStatus)
// admin.post('/orders/cancel', orderController.cancelOrder);
// Route to view order details
// admin.get('/orders/:orderId', orderController.viewOrderDetails);


//-------------------------------- Inventory Management Routes---------------------------------



// admin.get('/inventory', orderController.listInventory);
// admin.post('/inventory/update', orderController.updateStock);

//------------------------------------------ order Management-----------------------------------------------------

admin.get('/orders',isAdmin,orderController.listOrders);
admin.post('/orders/status',orderController.changeOrderStatus);
admin.get('/viewReason/:orderId/:productId',isAdmin,orderController.viewReturnReason);
admin.post('/processReturn/:orderId/:productId',orderController.postViewReason)
//admin_routes.post('/orders/cancel',orderController.cancelOrder);
admin.get('/orders/:id',orderController.viewOrderDetails)







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
admin.get('/salesReoprtView',isAdmin,saleController.salesReoprtView);
admin.get('/exportReport',isAdmin,saleController.exportReport)






module.exports=admin