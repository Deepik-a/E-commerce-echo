const mongoose=require('mongoose')
const addressSchema=require('../model/addressSchema')


const couponUsageSchema = mongoose.Schema({
  couponId:{
      type:mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required:true
  },
  usageCount:{
      type:Number,
      default:0
  }
},{_id:false})

const schema=new mongoose.Schema({
    name:{  
      type:String,
      required:true
    },
    phone:{
        type:Number
    },
    email:{
        type:String,      
    },
    password: {
        type:String,
    },
    address:{
        type:[addressSchema],
        default:[]
      },
      googleID: {
        type: String
    },
    couponUsed:{
      type:[couponUsageSchema],
      default:[]
  },
    isActive:{       //whether the user is active
      type:Boolean,
      default:true  // By making a user's account active automatically
    },
    isBlocked:{
      type:Boolean,
      default:false
    },
    authMethod: { type: String, enum: ['google', 'local'], default: 'local' }, // This field to identify login method
    couponUsed: [{
      couponId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Coupon' 
      },
      usageCount: { 
          type: Number, 
          default: 0 
      }
  }]
})

module.exports=mongoose.model('echoemporium2',schema)