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

        // Fetch all products that are active and have a valid category (not deleted)
        const products = await productSchema.find({
            isActive: true,
        }).populate('category');  // Populating the category

        // Filter products where category is not deleted
        const filteredProducts = products.filter(product => product.category && !product.category.isDeleted);

        console.log("Fetched Products:", filteredProducts);

        const categories = await categorySchema.find({ isDeleted: false });
        res.render('user/AllProduct', { products: filteredProducts, categories });
    } catch (error) {
        console.log('Error fetching products: ', error);
        res.status(500).send('Error fetching products');
    }
};




const sortAllproducts= async (req, res) => {
    console.log("sortAllProducts")
    const categories = await categorySchema.find({ isDeleted: false });
    let sortOption = {};

    switch (req.query.sort) {
        // case 'popularity':
        //     sortOption = { popularity: -1 }; // Assuming you have a 'popularity' field in your products
        //     break;
        case 'price_low_high':
            sortOption = { price: 1 }; // Sort by price ascending
            break;
        case 'price_high_low':
            sortOption = { price: -1 }; // Sort by price descending
            break;
       // case 'ratings':
          //  sortOption = { averageRating: -1 }; // Sort by ratings descending
          //  break;
       // case 'featured':
           // sortOption = { featured: -1 }; // Assuming you have a 'featured' field
           // break;
        case 'new_arrivals':
            sortOption = { createdAt: -1 }; // Assuming 'createdAt' field stores product creation date
            break;
        case 'az':
            sortOption = { name: 1 }; // Sort alphabetically A-Z
            break;
        case 'za':
            sortOption = { name: -1 }; // Sort alphabetically Z-A
            break;
        default:
            sortOption = {}; // Default sort, no sorting
    }

    const products = await productSchema.find().sort(sortOption);
    res.render('user/AllProduct', { products,categories});
};


const searchbyProducts= async (req, res) => {
   
        const searchQuery = req.body.search;
    const categories = await categorySchema.find({ isDeleted: false });

    
        // Perform a database search for products
        const products = await productSchema.find({
            name: { $regex: searchQuery, $options: 'i' } // Case-insensitive search
        });
    
        // If no products found, show "no results" message
        const message = products.length === 0 ? 'Sorry, no results found! Please check the spelling or try searching for something else.' : '';
    
        // Render the all-products page with the search results
        res.render('user/Allproduct', {
            products: products,
            message: message,
            categories// Assuming you are fetching categories too
        });
    };
    






module.exports = {
    getProductsByCategory,
    getProductDetail,
    getAllProducts,
    sortAllproducts,
    searchbyProducts
};
