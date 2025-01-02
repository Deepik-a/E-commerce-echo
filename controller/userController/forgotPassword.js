const userSchema = require('../../model/userSchema')

const generateOTP = require('../../services/otpgenerator')
const sendOTP = require('../../services/emailSender')

const bcrypt = require('bcrypt')

//------------------------------ Forget Page render ---------------------------------

const forgotPassword = (req, res) => {
    try {
        req.session.user = ''
        res.render('user/forgotPassword', {title: 'Forgot Password',user: req.session.user})
    } catch (error) {
        console.log(`error while rendering forgot Password page ${error}`)
    }
}


//------------------------------------- Forget ---------------------------------------

const forgotPasswordPost = async (req, res) => {
    try {
        const email = req.body.email;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email syntax' });
        }

        // Check if email exists in the database
        const checkEmail = await userSchema.findOne({ email: email });

        if (!checkEmail) {
            return res.status(404).json({ error: 'Email not registered' });
        }

        // Proceed with OTP generation
        const otp = generateOTP();
        sendOTP(email, otp);

        req.session.email = email;
        req.session.otp = otp;
        req.session.otpExpireTime = Date.now();

        res.status(200).json({ success: 'OTP sent successfully' });
    } catch (err) {
        console.log(`Error during forgot password page: ${err}`);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
};



//--------------------------------- Otp page is render --------------------------------

const forgotPasswordOtp = (req, res) => {
    try {
        res.render('user/forgotPasswordOtp', {title: 'OTP verification',email: req.session.email,otpTime: req.session.otpTime,user: req.session.user})
    } catch (error) {
        console.log(`error while loading forgot password otp ${error}`)
    }
}


//------------------------------------- Otp Getting ----------------------------------

const forgotPasswordOtpPost = async (req, res) => {
    try {
        if (req.session.otp !== undefined) {
            if (req.body.otp === req.session.otp) {
                res.render('user/resetpassword', { title: 'Reset Password' ,user:req.session.user})
            } else {
            req.flash('error', 'Invaild OTP')
            res.redirect('/forgotPasswordOtp')
            }
        } else {
            req.flash('error', 'Error occured retry')
            res.redirect('/forgotpassword')
        }
    } catch (error) {
        console.log(`error while forgot otp verification ${error}`)
    }
}


//----------------------------------- New Password -----------------------------------

const resetPasswordPost = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        console.log('New Password:', newPassword);  // Log for debugging
        console.log('Confirm Password:', confirmPassword);  // Log for debugging

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/forgotpasswordotp');
        }

        // Ensure password is provided
        if (!newPassword) {
            req.flash('error', 'Password is required');
            return res.redirect('/forgotpasswordotp');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('Hashed password:', hashedPassword);

        // Update the password in the database
        const update = await userSchema.updateOne(
            { email: req.session.email },
            { $set: { password: hashedPassword } }
        );

        console.log('Update result:', update);

        if (update.modifiedCount > 0) {
            req.flash('success', 'Password updated successfully');
            return res.redirect('/login');
        } else {
            req.flash('error', 'Error while updating password');
            return res.redirect('/forgotpasswordotp');
        }
    } catch (error) {
        console.error(`Error while resetting password: ${error}`);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect('/forgotpasswordotp');
    }
};





//----------------------------------- OTP Resend -----------------------------------

const forgotResend = (req, res) => {
    try {
        const email = req.params.email
        const otp = generateOTP()
        sendOTP(email, otp);
        req.session.otp = otp;
        req.session.otpTime = Date.now();
        req.flash('success', 'New OTP sent to mail')
        res.redirect('/forgotpasswordotp')
    } catch (error) {
        console.log(`error in resend otp forgot password  ${error}`)
    }
}


module.exports = {
    forgotPassword,
    forgotPasswordPost,
    forgotPasswordOtp,
    forgotPasswordOtpPost,
    resetPasswordPost,
    forgotResend
}
