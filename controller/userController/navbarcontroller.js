const productSchema = require('../../model/productSchema')
const categorySchema = require('../../model/categorySchema');
const userSchema =require('../../model/userSchema')
const mongoose = require('mongoose')

//----------------------------------- Home page render --------------------------------

const home = async (req, res) => {
  try {
  
     // Check if the user session exists
     if (req.session.user) {
      // Fetch user details from the database using the session data
      const user = await userSchema.findById(req.session.user);

      // Check if the user is blocked
      if (user && user.isBlocked) {
        console.log('User is blocked, redirecting to /account-blocked');
        req.session.user = null; // Clear the session
        req.flash('error', 'Your account has been blocked by the admin.');
        return res.redirect('/account-blocked'); // Redirect to the blocked account page -------
      }
    }
   const product = await productSchema.find({
               isActive: true,
           }).populate('category');  // Populating the category
   
           // Filter products where category is not deleted
           const products = product.filter(product => product.category && !product.category.isDeleted);
   
   
       
    const categories=await categorySchema.find({isDeleted:false})
    res.render('user/home', { categories, products, user: req.session.user})
  } catch (error) {
    console.log(`error while rendering home ${error}`)
  }
}

const showBlockedPage = (req, res) => {
  res.render('user/account-blocked', {
      errorMessage: 'Your account has been blocked by the admin. Please contact support for more information.'
  });
};





module.exports = { home ,showBlockedPage}

