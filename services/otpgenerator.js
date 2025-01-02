const otpgenerator=require('otp-generator')

const generateotp=()=>{
   const OTP= otpgenerator.generate(5,{
        lowerCaseAlphabets:false,
        upperCaseAlphabets:false,
        specialChars:false
    })
    return OTP
}


module.exports=generateotp;