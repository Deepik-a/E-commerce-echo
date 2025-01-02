const userSchema = require("../../model/userSchema");
const categorySchema=require('../../model/categorySchema')
const productSchema=require('../../model/productSchema')

const bcrypt = require("bcrypt");

const sendOTP = require("../../services/emailSender");
const generateotp = require("../../services/otpgenerator");

const passport = require('passport')
const auth = require('../../services/passport')



const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.render("user/Landingpage");
    } else {
      res.render("user/signup", {
        title: "Please Signup",
        user: req.session.user,
      });
    }
  } catch (error) {
    console.log(`error while renderin the page ${error}`);
  }
};

const signupPost = async (req, res) => {
  console.log(req.body)

  try {
    const details = {
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      confirmpassword: await bcrypt.hash(req.body.confirmpassword, 10),
      phone: req.body.phone,

    };

    const check = await userSchema.findOne({ email: details.email });

    if (check) {
      res.render("user/signup");
    } else {
     const otp= generateotp()
      sendOTP(details.email,otp);
      req.session.otp = otp;
      req.session.otpTime = Date.now();
      req.session.email = details.email;
      req.session.name = details.name;
      req.session.phone = details.phone;
      req.session.password = details.password;
      console.log(`Submitted OTP: ${req.body.otp}`);
      console.log(`Session OTP: ${req.session.otp}`);
      res.redirect("/otp");
    }
  } catch (error) {
    console.log(`error while renderin the page ${error}`);
  }


};


const otp=(req,res)=>{
  try{
   res.render('user/otp',{title:'OTP Verified',email: req.session.email,  otpTime: req.session.otpTime,}) 
  }catch(error){
    console.log('error');
  }
}



//------------------------------------ verify the otp -------------------------------

const otppost=async(req,res)=>{
  // console.log("entered post");
  try{
    console.log("entered try");
    if(req.body.otp===req.session.otp){
      console.log("entered 1st if");
      const details = {
        name: req.session.name,
        email: req.session.email,
        password: await bcrypt.hash(req.session.password, 10),
        phone: req.session.phone,
      };
    await userSchema.insertMany([details])
    .then(()=>{
      console.log(`new user registeres successfully`)
      res.redirect('/login')
    }).catch((error)=>{
      console.log(`error while user signup ${error}`)
    })
    console.log("entered await");
    }else{
      res.redirect('/otp')
    }
 
  }catch (error) {
    console.log(`error while renderin the page ${error}`);
  }

}


//-------------------------------------- Otp Resent ---------------------------------

const otpResend=(req,res)=>{

  try{
const email=req.session.email
const otp=generateotp()
sendOTP(email,otp)
req.session.otp=otp
req.session.otpTime=Date.now()
console.log("OTP sent succesfully");
res.redirect('/otp')
  }catch(error){
    console.log(`error while resend otp ${error}`)
  }
}


// GET login page
const login = async (req, res) => {
  try {
    const categories = await categorySchema.find({ isDeleted: false });

    if (req.session.user) {
      // Fetch products only if the user is logged in
      const products = await productSchema.find({ isActive: true });

      // Render Landingpage with user session data
      return res.render('user/Landingpage', {
        categories,
        user: req.session.user,
        products,
      });
    }

    // Render login page if no active session
    res.render('user/login', { title: 'Login', user: null });
  } catch (error) {
    console.error(`Error in GET /login: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
};

// POST login form handler
const loginpost = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userSchema.findOne({ email });
    if (!user) {
      // Redirect if the user does not exist
      return res.redirect('/login?error=userNotFound');
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      return res.redirect('/login?error=blocked');
    }

    // Check if the password is correct
    // const isMatch = await bcrypt.compare(password, user.password); // Assuming bcrypt is used
    // if (!isMatch) {
    //   return res.redirect('/login?error=invalidPassword');
    // }

    // Set session for the logged-in user
    req.session.user = user;

    // Fetch categories and products
    const categories = await categorySchema.find({ isDeleted: false });
    const products = await productSchema.find({ isActive: true });

    // Debugging
    console.log('User found and session set:', user);
    console.log('Categories:', categories);
    console.log('Products:', products);

    // Redirect to the landing page after successful login
    res.render('user/Landingpage', { categories, user, products });
  } catch (error) {
    console.error(`Error during login: ${error.message}`);
    // Redirect to login with a generic error
    res.redirect('/login?error=serverError');
  }
};


const logout = (req, res) => {
  try {
    req.session.destroy(error => {
      if (error) {
        console.log(`error while logout ${error}`)
      }
    })
    res.redirect('/')
  } catch (error) {
    console.log(`error while logout user ${error}`)
  }
}


// //-------------------------------------- google auth -----------------------------------

// const googleAuth = (req, res) => {
 
//   try {
//     passport.authenticate('google', {
//       scope: ['email', 'profile']
//     })
//   } catch (err) {
//     console.log(`Error on google authentication ${err}`)
//   }
// }


// //----------------------------------- google auth callback  ----------------------------

// const googleAuthCallback = (req, res, next) => {
//   console.log("googleAuthCallback") 
//     passport.authenticate('google', { failureRedirect: '/' }),
//     (req, res) => {
//       res.render("user/home");
//     };
// }






module.exports = {

  signup,
  signupPost,
  otp,
  otppost,
otpResend,
login,
loginpost,
logout,
// googleAuth ,
// googleAuthCallback
};
