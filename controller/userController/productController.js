const userSchema=require('../../model/userSchema')
const productSchema=require('../../model/productSchema')
const categorySchema=require('../../model/categorySchema')
const Offer=require('../../model/offerSchema')



// Controller to get products by category
const getProductsByCategory = async (req, res) => {
  try {
   
      const categoryName = req.params.categoryName;
   

      // First, find the category by its name
      const category = await categorySchema.findOne({ name: categoryName,isDeleted:false });
      if (!category) {
          return res.status(404).send('Category not found');
      }
      
     
      // Then, find products that match the category's ObjectId
      const products = await productSchema.find({ category: category._id, isActive: true })
                                    .populate('category'); // populate to get category details if needed
     
    
      // Render the EJS file with the fetched products and category name
      res.render('user/categoryProducts', { products, categoryName });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
};



// Get Product Detail by ID
const getProductDetail = async (req, res) => {
    try {
        console.log("entered product detail")
        const productId = req.params.id; // Get product ID from URL params
       // Fetch product and populate category with a filter for isDeleted: false
       const product = await productSchema.findById(productId).populate({
        path: 'category',
        match: { isDeleted: false }, // Only include categories where isDeleted is false
    });



    if (!product || !product.category) {
        return res.status(404).render('404', { message: 'Product or category not found' });
    }

        const currentDate = new Date();

        // Fetch applicable offers
        const applicableOffers = await Offer.find({
            $and: [
                { isActive: true },
                { startDate: { $lte: currentDate } },
                { endDate: { $gte: currentDate } },
                {
                    $or: [
                        { applicableProduct: product._id },
                        { applicableCategory: product.category }
                    ]
                }
            ]
        });

        // Prioritize product offer over category offer if both exist
        let productOffer = null;
        let categoryOffer = null;

        // Filter product and category offers
        applicableOffers.forEach((offer) => {
            if (offer.offerType === 'product' && offer.applicableProduct.toString() === product._id.toString()) {
                productOffer = offer; // Product offer takes priority
            } else if (offer.offerType === 'category' && offer.applicableCategory.toString() === product.category._id.toString()) {
                categoryOffer = offer;
            }
        });

        // If a product offer exists, apply that offer
        let appliedOffer = productOffer || categoryOffer;


        // Get the category name from the populated category object
        const categoryName = product.category.name;

        // Render the product detail page and pass product data + categoryName + the applicable offer
        res.render('user/productsDetail', { product, categoryName, applicableOffers, appliedOffer });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Server Error');
    }
};





// Controller to fetch all products
const getAllProducts = async (req, res) => {
    try {
        console.log("Fetching all products...");

        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 products per page
        const skip = (page - 1) * limit;

        // Sorting options
        let sortOption = {};

        switch (req.query.sort) {
            case 'price_low_high':
                sortOption = { price: 1 }; // Sort by price ascending
                break;
            case 'price_high_low':
                sortOption = { price: -1 }; // Sort by price descending
                break;
            case 'new_arrivals':
                sortOption = { createdAt: -1 }; // Newest first
                break;
            case 'az':
                sortOption = { name: 1 }; // Alphabetically A-Z
                break;
            case 'za':
                sortOption = { name: -1 }; // Alphabetically Z-A
                break;
            default:
                sortOption = {}; // Default: no sorting
        }

        // Filter by category if provided
        let filterOption = {};
        if (req.query.category && req.query.category !== 'all') {
            filterOption.category = req.query.category; // Apply category filter
        }

        // Fetch products with pagination, filtering by active status and valid category
        const products = await productSchema
            .find({ isActive: true, ...filterOption }) // Apply category filter here
            .populate('category') // Populating the category
            .sort(sortOption) // Apply sorting option
            .skip(skip)
            .limit(limit);

        // Filter products to ensure category exists and is not deleted
        const filteredProducts = products.filter(product => product.category && !product.category.isDeleted);

        // Get total count of active products with valid categories
        const totalProductsCount = await productSchema.countDocuments({
            isActive: true,
            ...filterOption, // Include category filter in count
        });

        // Fetch all non-deleted categories
        const categories = await categorySchema.find({ isDeleted: false });

        // Calculate total pages
        const totalPages = Math.ceil(totalProductsCount / limit);

        console.log("Filtered Products:", filteredProducts);

        // Render the AllProduct view with pagination details and filters
        res.render('user/Allproduct', {
            products: filteredProducts,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            selectedSort: req.query.sort || 'price_low_high', // Keep track of selected sort
            selectedCategory: req.query.category || 'all', // Keep track of selected category filter
        });

        console.log("sort req.query.sort",req.query.sort)
        console.log("sort req.query.category",req.query.category)
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
};



const sortAllproducts = async (req, res) => {
    try {
        console.log("sortAllProducts");

        // Fetch categories (if needed)
        const categories = await categorySchema.find({ isDeleted: false });

        // Set default sorting option
        let sortOption = {};
        let filterOption = {}; // Filter option will hold the category filter

        // Determine the sorting option based on the query parameter
        switch (req.query.sort) {
            case 'price_low_high':
                sortOption = { price: 1 }; // Sort by price ascending
                break;
            case 'price_high_low':
                sortOption = { price: -1 }; // Sort by price descending
                break;
            case 'new_arrivals':
                sortOption = { createdAt: -1 }; // Newest first
                break;
            case 'az':
                sortOption = { name: 1 }; // Alphabetically A-Z
                break;
            case 'za':
                sortOption = { name: -1 }; // Alphabetically Z-A
                break;
            default:
                sortOption = {}; // Default: no sorting
        }

        // Check if category filter is applied
        if (req.query.category && req.query.category !== 'all') {
            filterOption.category = req.query.category;  // Apply category filter
        }

        // Pagination logic
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 products per page
        const skip = (page - 1) * limit;

        // Fetch products with category filter and sorting applied
        const products = await productSchema
            .find({ isActive: true, ...filterOption }) // Add category filter here
            .sort(sortOption)  // Apply the sorting option
            .skip(skip)  // Pagination logic: skip for the current page
            .limit(limit)  // Limit the number of products per page
            .populate('category'); // Optional: Populate category data if needed

        console.log("Fetched Products:", products);

        // Count total products based on the filter to calculate pagination
        const totalProductsCount = await productSchema.countDocuments({ isActive: true, ...filterOption });
        const totalPages = Math.ceil(totalProductsCount / limit);

        console.log("Total Pages:", totalPages);
        console.log(req.query.sort,"quer param of sort sortallproductd") 
        console.log(req.query.category,"quer param of sort sortallproductd")
        // Return JSON response with products, categories, pagination details, and applied filters
        return res.json({
            products,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            selectedSort: req.query.sort || 'price_low_high', // Keep track of selected sort
            selectedCategory: req.query.category || 'all', // Keep track of selected category filter
        });
          

    } catch (error) {
        console.error("Error in sortAllProducts:", error);
        res.status(500).send("Server Error");
    }
};




const searchbyProducts = async (req, res) => {
    try {
        const searchQuery = req.body.search;
        const categories = await categorySchema.find({ isDeleted: false });

        // Extract the selected category and sort from query params
        const selectedCategory = req.query.category || 'all';
        const selectedSort = req.query.sort || 'price_low_high'; // Default to 'price_low_high' if no sort is selected

        // Check for special characters in the search query
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (specialCharRegex.test(searchQuery)) {
            return res.render("user/Allproduct", {
                products: [],
                message: "Sorry, not found!",
                categories,
                currentPage: 1,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 5,
                searchQuery,
                selectedCategory,
                selectedSort, // Pass selected sort to the response
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Build the query filter, including the category if specified
        const filter = {
            name: { $regex: searchQuery, $options: "i" },
            isActive: true,
        };

        if (selectedCategory !== 'all') {
            filter.category = selectedCategory;  // Apply the selected category filter
        }

        // Determine the sorting option based on selectedSort
        let sortOption = {};
        switch (selectedSort) {
            case 'price_low_high':
                sortOption = { price: 1 }; // Sort by price ascending
                break;
            case 'price_high_low':
                sortOption = { price: -1 }; // Sort by price descending
                break;
            case 'new_arrivals':
                sortOption = { createdAt: -1 }; // Newest first
                break;
            case 'az':
                sortOption = { name: 1 }; // Alphabetically A-Z
                break;
            case 'za':
                sortOption = { name: -1 }; // Alphabetically Z-A
                break;
            default:
                sortOption = {}; // Default: no sorting
        }

        // Perform the search with category filter and sorting applied
        const products = await productSchema
            .find(filter)
            .sort(sortOption)  // Apply the sorting option
            .skip(skip)
            .limit(limit);

        const totalProductsCount = await productSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalProductsCount / limit);

        const message =
            products.length === 0
                ? "Sorry, no results found! Please check the spelling or try searching for something else."
                : "";

        res.render("user/Allproduct", {
            products,
            message,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            searchQuery,
            selectedCategory,  // Include the selected category in the response hello
            selectedSort,       // Include the selected sort in the response 
        });
    } catch (error) {
        console.error("Error in searchbyProducts:", error);
        res.status(500).send("Server Error");
    }
};










module.exports = {
    getProductsByCategory,
    getProductDetail,
    getAllProducts,
    sortAllproducts,
    searchbyProducts
};
