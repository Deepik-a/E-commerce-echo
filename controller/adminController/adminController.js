const userSchema=require('../../model/userSchema')
const categorySchema = require('../../model/categorySchema');
const admin=(req,res)=>{
    try{
        res.render('admin/login')
}catch(error){
    console.log(`error while rendering admin dashboard ${error}`)
}
}





const blockUser = async (req, res) => {
    try {
        


        console.log(req.body)
        const userId = req.params.id;
        await userSchema.findByIdAndUpdate(userId, { isBlocked: true });
        const users=await userSchema.find()
        res.redirect('/admin/users')

      
    } catch (err) {
        res.status(500).json({ message: 'Error blocking user' });
    }
};


const unblockUser = async (req, res) => {
    try {
        const userId = req.params.ideee;
     
        
        let identify = await userSchema.findByIdAndUpdate(userId, { isBlocked: false });
        const users=await userSchema.find()
        
        res.redirect('/admin/users')
       
    } catch (err) {
        res.status(500).json({ message: 'Error unblocking user' });
    }
};




const adminloginpost=async(req,res)=>{
    try{
        if(req.body.email===process.env.ADMIN_EMAIL && req.body.password===process.env.ADMIN_PASSWORD)
            req.session.admin=req.body.email
  res.render("admin/dashboard")
    } catch (error) {
        console.log(`error from login post ${error}`)
    }
}

const listuser=async(req,res)=>{
    try{
        const users=await userSchema.find()
        res.render('admin/usermanagment',{users})
    }catch (err) {
        res.status(500).json({ message: 'Error fetching user' });
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await categorySchema.find({ isDeleted: false });
        
        res.render('admin/Category', { categories,error:''});
    } catch (error) {
        res.render('admin/Category', { error: 'Error fetching categories', categories: [] });
    }
};




const logout = (req, res) => {
    try {
      req.session.destroy(error => {
        if (error) {
          console.log(`error while logout ${error}`)
        }
      })
      res.redirect('/admin/login')
    } catch (error) {
      console.log(`error while logout user ${error}`)
    }
  }






module.exports={
    admin,
    listuser,
    // adminlogin,
    unblockUser,
    blockUser,
    adminloginpost,
    getCategories,
    logout
}