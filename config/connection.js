const mongoose=require('mongoose')

const connectDB=async()=>{
try{
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
console.log("mongoDB connected");

}catch(error){
    console.log('error while connecting mongodb',error.message);
}
}



module.exports= connectDB