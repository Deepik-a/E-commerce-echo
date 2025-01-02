const userSchema = require('../model/userSchema')


// -------------------- check user is login or not  ------------------------

async function isUser (req,res,next){
    try {
        
        if(req.session.user){
            const user = await userSchema.findById(req.session.user);
            if(user.isBlocked){
                next();
            }else{
                req.session.user ='';
                req.flash('error','user is blocked by admin')
                res.redirect('/login')
            }
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(`user session error ${error}`)
    }
}

module.exports = isUser