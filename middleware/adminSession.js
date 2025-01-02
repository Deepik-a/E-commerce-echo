

//----------- check admin is there or not -------------

function isAdmin(req,res,next){
    if(req.session.admin){
        next();
    }else{
        res.redirect('/admin/login')
    }
}

module.exports= isAdmin;