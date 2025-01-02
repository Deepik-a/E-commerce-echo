const nodemailer=require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:process.env.SMTP_PORT,
    secure:false,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
    }
})



function sendOTP(email,otp){

    console.log(email);
    console.log('jk');
    console.log(otp);
    
    

    
    
const mailOptions={
    from:"Echo Emporium",
    to:email,
    subject:"Verifivation code from Echo Emporium",
    text: `Enter the One Time Password ${otp} to verify your account`
}

transporter.sendMail(mailOptions,(err,info)=>{
    if(err){
        console.log(`Error while sending mail ${err}`)
    }else{
        console.log('Email sent successfully')
    }
})



}

module.exports=sendOTP





