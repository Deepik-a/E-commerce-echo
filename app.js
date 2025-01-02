const express=require('express')
const app=express()
const path=require("path")
const expressLayouts=require('express-ejs-layouts')
const flash = require('connect-flash')
const session=require('express-session')
const passport = require('passport');
require("./services/passport")



const dotenv=require('dotenv').config()



const connectdb=require('./config/connection')
//--------------------- mongodb connection ---------------------

connectdb();




//----------------------- Requiring Routes -------------------------
const adminRoutes=require('./routes/adminRoute')
const userRoutes=require('./routes/userRoute')


//--------------------- Setting view engine --------------------
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))

//layout folder

//-----------------------public static files -------------------

app.use('/public',express.static(path.join(__dirname,'public')))


//------------------------- url encoded data -------------------
//--------------------------- middlewares -----------------------
app.use(express.json())
app.use(express.urlencoded({extended: true}))


app.use('/uploads', express.static('uploads'));



//--------------------------- session handling -----------------------
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  

// Flash setup
app.use(flash());

app.use(expressLayouts);
app.set('layout', 'layouts/layout');



const port=process.env.PORT || 3000


app.use('/',userRoutes)
app.use('/admin',adminRoutes)
app.get('*',(req,res) =>{
  res.render('user/404')
})
// app.get('/',(req,res)=>{
//   res.render("user/hloo")
// })



app.listen(port,()=>{
console.log(`http://localhost:${port}`);
})