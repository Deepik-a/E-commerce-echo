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

        // Fetch products with pagination, filtering only active products and valid categories
        const products = await productSchema
            .find({ isActive: true })
            .populate('category') // Populating the category
            .skip(skip)
            .limit(limit);

        // Filter products where category exists and is not deleted
        const filteredProducts = products.filter(product => product.category && !product.category.isDeleted);

        // Get total count of active products with valid categories
        const totalProductsCount = await productSchema.countDocuments({
            isActive: true,
        });

        // Fetch all non-deleted categories
        const categories = await categorySchema.find({ isDeleted: false });

        // Calculate total pages
        const totalPages = Math.ceil(totalProductsCount / limit);

        console.log("Filtered Products:", filteredProducts);

        // Render the AllProduct view with pagination details
        res.render('user/Allproduct', {
            products: filteredProducts,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
};





const sortAllproducts = async (req, res) => {
    try {
        console.log("sortAllProducts");

        const categories = await categorySchema.find({ isDeleted: false });
        let sortOption = {};

        // Determine the sorting option
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

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 products per page
        const skip = (page - 1) * limit;

        // Fetch and sort products with pagination
        const products = await productSchema
            .find({ isActive: true })
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalProductsCount = await productSchema.countDocuments({ isActive: true });
        const totalPages = Math.ceil(totalProductsCount / limit);

        res.render('user/AllProduct', {
            products,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            sort: req.query.sort, // Keep track of the sorting option
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

        // Check for special characters
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (specialCharRegex.test(searchQuery)) {
            // Respond with "Sorry, not found" if special characters are present
            return res.render("user/AllProduct", {
                products: [],
                message: "Sorry, not found!",
                categories,
                currentPage: 1,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 5,
                searchQuery, // Keep track of the invalid search query
            });
        }

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 products per page
        const skip = (page - 1) * limit;

        // Perform a database search for products with pagination
        const products = await productSchema
            .find({
                name: { $regex: searchQuery, $options: "i" }, // Case-insensitive search
                isActive: true, // Ensure only active products are fetched
            })
            .skip(skip)
            .limit(limit);

        const totalProductsCount = await productSchema.countDocuments({
            name: { $regex: searchQuery, $options: "i" },
            isActive: true,
        });
        const totalPages = Math.ceil(totalProductsCount / limit);

        // If no products found, show "no results" message
        const message =
            products.length === 0
                ? "Sorry, no results found! Please check the spelling or try searching for something else."
                : "";

        res.render("user/AllProduct", {
            products,
            message,
            categories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            searchQuery, // Keep track of the search query for pagination
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
