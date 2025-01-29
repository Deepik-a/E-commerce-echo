const userSchema=require('../../model/userSchema')
const categorySchema = require('../../model/categorySchema');
const Product = require('../../model/productSchema');
const Order = require('../../model/orderSchema');
const {orderStatus} = require('../../controller/userController/orderController');



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




const adminloginpost = async (req, res) => {
  try {
      if (req.body.email === process.env.ADMIN_EMAIL && req.body.password === process.env.ADMIN_PASSWORD) {
          req.session.admin = req.body.email;
          console.log('Login successful, rendering dashboard');               
          res.status(200).json({ message: "Login suuceesfull"});
      } else {
          res.status(401).json({ message: "Invalid email or password" });
      }
  } catch (error) {
      console.log(`Error from login post: ${error}`);
      res.status(500).json({ message: "Internal server error" });
  }
};


const getdashboard=(req,res)=>{
  try{
      res.render('admin/DashboardDesign')
}catch(error){
  console.log(`error while rendering admin DashboardDesign Page${error}`)
}
}

const listuser = async (req, res) => {
    try {
        // Extract page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 users per page

        // Calculate the starting index for the query
        const skip = (page - 1) * limit;

        // Fetch the users with pagination
        const users = await userSchema.find().skip(skip).limit(limit);

        // Get the total count of users for calculating total pages
        const totalUsers = await userSchema.countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalUsers / limit);

        // Render the page with the fetched users and pagination info
        res.render('admin/usermanagment', {
            users,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};


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


  const applyDateFilter = (filter) => {
  

    const now = new Date();
    let dateFilter = {};
  
    if (filter === "day") {
      dateFilter.createdAt = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (filter === "week") {
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
      startOfWeek.setDate(now.getDate() - distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
  
      // Set end of the week
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
  
      dateFilter.createdAt = { $gte: startOfWeek, $lt: endOfWeek };
    } else if (filter === "month") {
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1), // Start of month
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Start of next month
      };
    } else if (filter === "year") {
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(), 0, 1), // Start of year
        $lt: new Date(now.getFullYear(), 12, 31), // End of year
      };
    }
  
    return dateFilter;
  };
  


const dashboard = async(req, res)  =>{ 
    try {
     const startOfDay = new Date();
     startOfDay.setHours(0, 0, 0, 0);
   
     const endOfDay = new Date();
     endOfDay.setHours(23, 59, 59, 999);
   
     const totalCustomers = await userSchema.find();
      const totalUsers = totalCustomers.length;
   console.log('started aggregation totalUsers',totalUsers)
   
   // daily data start 
      const dailyOrder = await Order.aggregate([
       {
         // Match orders that are not cancelled and have a status of 'Delivered', 'Pending', or 'Shipped'
         $match: {
           status: { $in: ["Delivered", "Pending", "Shipped", "Paid"] },
           isCancel:false,
           paid:true
         },
       },
       {
         // Unwind items array to calculate metrics based on individual products
         $unwind: "$items"
       },
       {
         // Group by day
           $group: {
             _id: {
               year: { $year: "$createdAt" },
               month: { $month: "$createdAt" },
               day: { $dayOfMonth: "$createdAt" },
             },
             totalDailyOrders: { $sum: 1 }, // Total number of orders
             totalProductsSold: { $sum: "$items.productCount" }, // Total products sold
             totalSales: {
               $sum: {
                 $multiply: ["$items.productPrice", "$items.productCount"],
               },
             }, // Sum of product discount price * product count
             totalDailyProfit: {
               $sum: {
                 $multiply: ["$items.productPrice", "$items.productCount", 0.1],
               },
             }, // Assume 10% profit for simplicity
           },
       },
       {
         // Project fields for readability
         $project: {
           _id: 0,
           date: {
             $dateFromParts: {
               year: "$_id.year",
               month: "$_id.month",
               day: "$_id.day",
             },
           },
           totalDailyOrders: 1,
           totalProductsSold: 1,
           totalSales: 1,
           totalDailyProfit: 1,
         },
       },
       {
         // Sort by date in descending order
         $sort: { date: -1 },
       },
       
      ]);
   
       console.log("dailyOrder",dailyOrder)  
   
   
     //  daily data end
   
     //Total sale Amount start
   
     const totalSaleAmount = await Order.aggregate([
       // Match orders with the desired statuses
       {
         $match: {
           status: { $in: ["Pending", "Paid", "Delivered", "Shipped"] },
           paid:true
         }
       },
       // Group by null to sum the totalPrice
       {
         $group: {
           _id: null,
           totalAmount: { $sum: "$payableAmount" }
         }
       }
     ]);
     console.log("totalSaleAmount",totalSaleAmount)
     const finalTotalSaleAmount = (totalSaleAmount && totalSaleAmount.length > 0 && totalSaleAmount[0]?.totalAmount !== undefined)
     ? totalSaleAmount[0].totalAmount.toFixed(2)
     : "0.00";
     console.log("finalTotalSaleAmount",finalTotalSaleAmount)
   
     //Total sale Amount end
     
    //----------------------- Top selling products---------------------

    const filter = req.query.filter || "day";
    const dateFilter = applyDateFilter(filter);

    console.log("data filter ", filter);

    const topSellingProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ["Delivered", "Shipped", "Pending","Paid"] },
          isCancel: false,
          createdAt: dateFilter.createdAt,
          paid:true
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalQuantitySold: {
            $sum: { $toInt: "$items.productCount" },
          },
          totalRevenue: { $sum: "$items.productPrice" },
          productName: { $first: "$items.productName" },
          category: { $first: "$items.productCategory" },
          productDiscount: { $first: "$items.productDiscount" },
          productPrice: { $first: "$items.productPrice" },
        },
      },
      {
        $sort: { totalQuantitySold: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    console.log(`popular product before populating ${topSellingProducts}`)
    const productData = await Product.populate(topSellingProducts, {
      path: "_id",
      populate: { path: "category", select: "name" },
      select: "name discount category",
    });
    
        console.log("Product data: ", productData);
    
        //----------------------- Top selling products end---------------------
    
        
          //----------------------- pie chart categgory perfomance  ---------------------
    
          const categoryFilter = req.query.filter || "day";
          console.log(`categoryFilter= ${categoryFilter}`)
          const CategoryDateFilter = applyDateFilter(categoryFilter);
        console.log(`categoryDateFilter = ${CategoryDateFilter}`)
          const categoryPerfomance = await Order.aggregate([
            {
              $match: {
                status: { $in: ["Delivered", "Shipped", "Pending", "Paid"] },
                isCancel: false,
                createdAt: CategoryDateFilter.createdAt,
                paid:true
              },
            },
            { $unwind: "$items" },
    
            {
              // First lookup: Join with the Product collection to get product details
              $lookup: {
                from: "products", // Name of the product collection
                localField: "items.productId",
                foreignField: "_id",
                as: "productData",
              },
            },

    
            {
              // Unwind the productData array to have direct access to product details
              $unwind: "$productData",
            },
    
            {
              // Second lookup: Join with the Category collection to get category details
                $lookup: {
                  from: "categories", // Name of the category collection
                  localField: "productData.category",
                  foreignField: "_id",
                  as: "categoryData",
                },
              },
    
            {
              // Unwind the categoryData array to get direct access to category details
              $unwind: "$categoryData",
            },
    
            {
              // Group by the category name
              $group: {
                _id: "$categoryData.name", // Group by category name
                totalQuantitySold: {
                  $sum: { $toInt: "$items.productCount" },
                },
              },
            },
            {
              // Project the required fields
              $project: { 
                _id: 0,
                category: "$_id", // Set category to the category name from the group _id
                totalQuantitySold: 1,
              },
            },
            { $sort: { totalQuantitySold: -1 } },
          ]);



          const categoryLabels = categoryPerfomance.map((item) => item.category);   
          const categoryData = categoryPerfomance.map(
            (item) => item.totalQuantitySold
          );
          
    
          console.log(`cartegoryData = ${categoryData}`);
    
    
    
          //----------------------- pie chart categgory perfomance  end ---------------------
    
            //--------------- weekly dashboard data -----------------------
    
            const filterMain = req.query.filter || "week";
    
            const dateFilterMain = applyDateFilter(filterMain)
      
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate());
            startOfWeek.setHours(0, 0, 0, 0);
      
            const endOfWeek = new Date();
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to the end of the week (Saturday)
            endOfWeek.setHours(23, 59, 59, 999);
      
            const order = await Order.aggregate([
              {
                $match: {
                  status: { $in: ["Delivered", "Shipped", "Pending", "Paid"] },
                  isCancel: false,
                  createdAt: dateFilter.createdAt, // Apply the filtered date range
                },
              },
              {
                $group: {
                  _id: { $dayOfMonth: "$createdAt" }, // Group by day of the month for weekly data (modify based on filter)
                  totalDailySales: { $sum: "$payableAmount" }, // Sum of total sales
                  totalDailyProfit: { $sum: { $multiply: ["$payableAmount", 0.1] } }, // Assume profit is 10% of total sales
                },
              },
              {
                $sort: { _id: 1 },
              },
            ]);
        console.log("order",order)
      
            const categories = order.map((item) => `Day ${item._id}`);
            const totalSalesData = order.map((item) => item.totalDailySales.toFixed(2));
            const totalProfitData = order.map((item) => item.totalDailyProfit.toFixed(2));
      
            console.log("category : ",categories);
            console.log("totalSalesData : ",totalSalesData);
            console.log("totalProfitData: ", totalProfitData);
    
            
          if (
            req.xhr ||
            req.headers["content-type"] === "application/json" ||
            req.headers.accept.indexOf("json") > -1
          ) {
            console.log("Fetch request detected");
            // Send JSON response for AJAX
            return res.json({
              topSellingProducts: productData,
              categoryLabels,
              categoryData,
              //main cart
              categories,
              totalSalesData,
              totalProfitData,
              finalTotalSaleAmount
            });
          }
         
          console.log(`categoryLabels = ${categoryLabels}`);
          console.log(`categoryData = ${categoryData}`);
          
    
    res.render('admin/adminDashboard',{
      dailyOrder,
      totalUsers,
      topSellingProducts:productData,
      categories:JSON.stringify(categories),
      totalSalesData:JSON.stringify(totalSalesData),
      totalProfitData:JSON.stringify(totalProfitData),
      categoryLabels:JSON.stringify(categoryLabels),
      categoryData:JSON.stringify(categoryData),
      finalTotalSaleAmount,
    });
    
     } catch (error) {
      console.log(`error from dashboard${error}`);
      res.status(500).send("Internal Server Error");
    
     }
    
    }





    const dashboardFilter = async(req,res) =>{
        try {
            console.log("entered dashBoard filter")
          const filter = req.query.filter;
          console.log("filter",filter)
          let matchCondition = {
            status: { $in: ["Delivered", "Pending", "Shipped","Paid"] },
            paid:true,
            isCancel: false,
          };
          
          let startDate, endDate;
      
          switch (filter) {
            case "yesterday":
              startDate = new Date();
              startDate.setDate(startDate.getDate() - 1);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setDate(endDate.getDate() - 1);
              endDate.setHours(23, 59, 59, 999);
              break;
      
            case "today":
              startDate = new Date();
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
              break;
      
            case "thisWeek":
              startDate = new Date();
              startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of the week
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
              break;
            case "thisMonth":
              startDate = new Date();
              startDate.setDate(1); // First day of the month
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
              break;
            case "thisYear":
              startDate = new Date(new Date().getFullYear(), 0, 1); // First day of the year
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
              break;
      
            default:
              // Default case can be today
              startDate = new Date();
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
          }
      
          matchCondition.createdAt = { $gte: startDate, $lt: endDate };
      
          const Order = await Order.aggregate([
            { $match: matchCondition },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$productPrice" },
                totalProfit: {
                  $sum: { $multiply: ["$productPrice", 0.1] },
                },
              },
            },
          ]);
          console.log("Order",Order)
          res.json({
            totalSales: Order[0]?.totalSales || 0,
            totalProfit: Order[0]?.totalProfit || 0,
          }); 
        
        } catch (error) {
          console.log(`error from dashboardFilter ${error}`)
        }
      }

    module.exports={
        admin,
        listuser,
       dashboard,
        unblockUser,
        blockUser,
        adminloginpost,
        getCategories,
        logout,
        dashboardFilter,
        getdashboard
    }
    
    
