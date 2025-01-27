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
  try {
    // Destructure values from the request body
    const { name, email, password, confirmpassword, phone } = req.body;

    // Check if the passwords match
    if (password !== confirmpassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match. Please try again.",
      });
    }

    // Hash the password once before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const details = {
      name,
      email,
      password: hashedPassword, // Store the hashed password
      phone,
    };

    // Check if the user already exists
    const check = await userSchema.findOne({ email: details.email });

    if (check) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login.",
      });
    } else {
      // Generate OTP
      const otp = generateotp();
      sendOTP(details.email, otp);

      // Store OTP and user details in the session
      req.session.otp = otp;
      req.session.otpTime = Date.now();
      req.session.email = details.email;
      req.session.name = details.name;
      req.session.phone = details.phone;
      req.session.password = details.password; // Store the hashed password

      // Store the user details in session for further use (such as OTP validation)
      req.session.details = details;

      return res.status(200).json({
        success: true,
        redirectUrl: "/otp", // Redirect to OTP verification page
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
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

const otppost = async (req, res) => {
  try {
    const { otp: submittedOtp } = req.body;
    const { otp: storedOtp, otpTime, otpExpiry, name, email, password, phone } = req.session;

    const verifyOtp = (submittedOtp, storedOtp) => submittedOtp === storedOtp;

    if (!verifyOtp(submittedOtp, storedOtp)) {
      // Calculate remaining time for OTP
      const currentTime = new Date().getTime();
      const timeElapsed = currentTime - otpTime;
      const timeLeft = Math.max(0, otpExpiry - timeElapsed / 1000);

      if (timeLeft <= 0) {
        // OTP expired
        return res.json({ success: false, message: 'OTP expired. Please request a new one.', redirectUrl: '/resend' });
      }
      return res.json({ success: false, message: 'Invalid OTP.', timer: timeLeft });
    }

    // OTP is valid, create a new user
    console.log(password);
    const userDetails = {
      name,
      email,
      password: password, // Hash password
      phone,
    };

    await userSchema.insertMany([userDetails]);
    console.log('New user registered successfully');
    return res.json({ success: true, message: 'OTP verified successfully.', redirectUrl: '/login' });
  } catch (error) {
    console.error(`Error during OTP processing: ${error}`);
    return res.json({ success: false, message: 'An unexpected error occurred. Please try again.', redirectUrl: '/otp' });
  }
};





//-------------------------------------- Otp Resent ---------------------------------
const otpResend = async (req, res) => {
  try {
    console.log("Entered otpResend function");
    const email = req.session.email;

    if (!email) {
      console.log("No email found in session");
      return res.status(400).json({ success: false, message: "Session expired. Please login again." });
    }

    console.log("Email from session:", email);

    const otp = generateotp(); // Generate a new OTP
    await sendOTP(email, otp); // Send the OTP to the email

    req.session.otp = otp; // Store the OTP in session
    req.session.otpTime = Date.now(); // Update the OTP time

    console.log("OTP sent successfully:", otp);
    return res.status(200).json({ success: true, message: "OTP resent successfully." });
  } catch (error) {
    console.error(`Error while resending OTP: ${error}`);
    return res.status(500).json({ success: false, message: "An error occurred while resending OTP." });
  }
};



// GET login page
const login = async (req, res) => {
  try {
    const categories = await categorySchema.find({ isDeleted: false });

    if (req.session.user) {
      // Fetch products only if the user is logged in
    
      const product = await productSchema.find({
                  isActive: true,
              }).populate('category');  // Populating the category
      
              // Filter products where category is not deleted
              const products = product.filter(product => product.category && !product.category.isDeleted);
      
              console.log("Fetched Products:", products);

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



const loginpost = async (req, res) => {
  try {
    console.log("entered logi post")
    const { email, password } = req.body;

    // Find user by email
    const user = await userSchema.findOne({ email });
    if (!user) {
      // Redirect if the user does not exist
      return res.status(400).json({ message: 'User not found!Please Signup' });
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      return res.status(400).json({ message: 'Your account is blocked. Please contact support.' });
    }
    console.log("password",password)
    console.log("user.password",user.password)
    console.log(user.email)
    console.log(email)
 
    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password); 
    console.log("isMatch",isMatch) // Compare entered password with stored hash
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password! Please try again.' });
    }
   
    // Set session for the logged-in user
    req.session.user = user;
        
    res.json({ message: 'Login successful!'});
    // Redirect to the landing page after successful login

  } catch (error) {
    console.error(`Error during login: ${error.message}`);
    // Redirect to login with a generic error
    res.status(500).json({ message: 'Server error, please try again later.' })
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
