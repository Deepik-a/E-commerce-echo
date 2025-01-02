// const productSchema = require('../../model/productSchema');
// const categorySchema = require('../../model/categorySchema')
// const offerSchema=require('../../model/offerSchema')
// const fs = require('fs');
// const path = require('path');
// const multer = require("multer") ;  

//  const uploadProduct = multer({
//     storage :  multer.diskStorage ({  
//         destination : "uploads",   
//         filename    : (req , file , cb ) =>{ 
//             cb(null , Date.now() + file.originalname)   
//         }
//      })
//  }).array( 'productImages' , 10 ) ;   


// //--------------------------------------------- Get a Product ---------------------------
// const getProduct = async (req, res) => {
//     try {
//         const categories = await categorySchema.find({isDeleted:false});
//         const products= await productSchema.find({ isActive: true });
//         res.render('admin/Product', { products, error: '',categories });
//     } catch (error) {
//         res.render('admin/Product', { error: 'Error fetching products', products: [] });
//     }
// };


// const addProduct= async (req, res) => {
//     uploadProduct(req, res, async function (err) {
//         console.log("addProduct")
//         if (err) {
//             return res.status(400).json({ error: 'Error uploading files: ' + err.message }) ; 
//         }
        
//         try {
           
//             const { name, price, description, stock, category,discount } = req.body;

              
//             console.log("req.files",req.files)

//             let imageUrls = [];
//         if (req.files && req.files.length > 0) {
//             imageUrls = req.files.map(file => `/uploads/${file.filename}`);
//         }



//             console.log("imageUrls",imageUrls)
//             const categoryName = await categorySchema.findOne({ name: category });
//                     if (!categoryName) {
//                         return res.status(400).json({ success: false, message: 'Category not found' });
//                     }
//                         // Calculate the final price after applying the discount
//             let finalPrice = price;
//             if (discount) {
//                 // Assuming 'discount' is a percentage, calculate the final price
//                 finalPrice = price - (price * discount / 100);
//             }
            
//             const product = new productSchema({
//                             name,
//                             price,
//                             description,
//                             stock,
//                             category: categoryName._id, // Save category ID
//                             imgArray: imageUrls, // Save the array of uploaded image filenames
//                             discount: discount || 0 ,
//                             finalPrice
//                             // Save the discount amount (or 0 if no discount)
//                         });
                
             
            
//             await product.save().then( savedproduct => console.log( savedproduct )).catch( error => console.log(error) );
            
//             res.status(200).json({ message: 'Product added successfully' });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: 'Error saving product: ' + error.message });
//         }
//     });
// };





// // const editProduct = async (req, res) => {
// //     console.log("Started editing product");

// //     uploadProduct(req, res, async function (err) {
// //         if (err) {
// //             console.error('Error uploading files:', err);
// //             return res.status(400).json({ error: 'Error uploading files: ' + err.message });
// //         }

// //         try {
// //             const { id } = req.params;
// //             console.log("Product ID to update:", id);

// //             // Parse removed images and log
// //             const removedImages = JSON.parse(req.body.removedImages || '[]');
// //             console.log("Removed images:", removedImages);

// //             // Log the new images that were uploaded
// //             const newImages = req.files;
// //             console.log("New uploaded images:", newImages);

// //             // Fetch the existing product
// //             const existingProduct = await productSchema.findById(id);
// //             if (!existingProduct) {
// //                 console.log("Product not found with ID:", id);
// //                 return res.status(404).json({ message: 'Product not found' });
// //             }
// //             console.log("Existing product found:", existingProduct);

// //             // Handle removed images
// //             if (removedImages.length > 0) {
// //                 console.log("Removing images from imgArray:", removedImages);

// //                 // Remove images from the product's imgArray
// //                 existingProduct.imgArray = existingProduct.imgArray.filter(img => !removedImages.includes(img));

// //                 // Delete removed images from the server
// //                 removedImages.forEach(image => {
// //                     const filePath = path.join('uploads', image);
// //                     console.log("Checking file path:", filePath);
// //                     if (fs.existsSync(filePath)) {
// //                         console.log("Deleting file:", filePath);
// //                         fs.unlinkSync(filePath);
// //                     } else {
// //                         console.log("File not found, skipping deletion:", filePath);
// //                     }
// //                 });
// //             }

// //             // Handle new images (add to the product's imgArray)
// //             if (newImages && newImages.length > 0) {
// //                 console.log("Adding new images to product imgArray");
// //                 newImages.forEach(file => {
// //                     console.log("New image file:", file.filename);
// //                     existingProduct.imgArray.push(file.filename);
// //                 });
// //             }

// //             // Extract other product fields and log them
// //             const { name, stock, price, description, category, isActive, discount } = req.body;
// //             console.log("Updated product details from request body:", { name, stock, price, description, category, isActive, discount });

// //             // Find the category by its name
// //             const categoryName = await categorySchema.findOne({ name: category });
// //             if (!categoryName) {
// //                 console.log("Category not found:", category);
// //                 return res.status(404).json({ message: 'Category not found' });
// //             }
// //             console.log("Category found:", categoryName);

// //             // Calculate the final price after applying the discount
// //             let finalPrice = price;
// //             if (discount) {
// //                 finalPrice = price - (price * discount / 100);
// //                 console.log("Final price after discount:", finalPrice);
// //             }
// //             if (finalPrice < 0) {
// //                 return res.status(400).json({ message: "Invalid final price calculation." });
// //               }
              

// //             // Update the product with the new data and log
// //             existingProduct.name = name;
// //             existingProduct.stock = stock;
// //             existingProduct.price = price;
// //             existingProduct.category = categoryName._id; // Save category ID
// //             existingProduct.description = description;
// //             existingProduct.isActive = isActive;
// //             existingProduct.discount = discount || 0;
// //             existingProduct.finalPrice = finalPrice; // Save the calculated final price

// //             // Log the updated product object before saving
// //             console.log("Updated product object:", existingProduct);

// //             // Save the updated product
// //             await existingProduct.save();
// //             console.log("Product updated successfully:", existingProduct);

// //             return res.status(200).json({ message: 'Product updated successfully', product: existingProduct });
// //         } catch (error) {
// //             console.error('Error updating product:', error);
// //             return res.status(500).json({ error: 'Error saving product: ' + error.message });
// //         }
// //     });
// // };








// // //--------------------------------------------- Get Edit Product Page ---------------------------
// const geteditProduct = async (req, res) => {
//     try {
//         // Get the current page from the query parameter, default to 1 if not provided
//         const page = parseInt(req.query.page) || 1;
//         const limit = 10; // Number of products per page
//         const offset = (page - 1) * limit;

//         // Fetch total number of products
//         const totalProducts = await productSchema.countDocuments();

//         // Fetch paginated products and populate the 'category' field
//         const products = await productSchema
//             .find({})
//             .populate('category', 'name') // Populate 'category' with only the 'name' field
//             .skip(offset) // Skip products for previous pages
//             .limit(limit); // Limit the number of products fetched

//         // Fetch all categories (only the 'name' field)
//         const categories = await categorySchema.find({}, 'name');

//         // Calculate the total number of pages
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Render the Productlist page with paginated products and categories
//         res.render('admin/Productlist', {
//             products,
//             categories,
//             success: req.query.success,
//             error: req.query.error,
//             currentPage: page,
//             totalPages
//         });
//     } catch (error) {
//         console.error('Error rendering edit product page:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };


// // // Route to remove the image
// // const Imageremove = async (req, res) => {
// //     try {
// //         console.log("Entered delete route");

// //         const { productId, imageUrl } = req.body;
// //         console.log('Received productId:', productId);
// //         console.log('Received imageUrl:', imageUrl);

// //         const product = await productSchema.findById(productId);
// //         if (!product) {
// //             console.log('Product not found');
// //             return res.status(404).json({ success: false, message: 'Product not found' });
// //         }

// //         console.log('Current image array before filter:', product.imgArray);

// //         // Remove the image from the imgArray
// //         product.imgArray = product.imgArray.filter(image => image.trim() !== imageUrl.trim());

// //         console.log('Updated image array after filter:', product.imgArray);

// //         // If the image is no longer in the array, it was successfully removed
// //         if (product.imgArray.length === product.imgArray.length) {
// //             console.log('Image successfully removed:', imageUrl);
// //         }

// //         await product.save();
// //         res.json({ success: true });

// //     } catch (error) {
// //         console.error('Error removing image:', error);
// //         res.status(400).json({ success: false, message: 'Error removing image' });
// //     }
// // };



 




// // //--------------------------------------------- List a Product ---------------------------
// const listProduct = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Find the product by ID and update its isActive status to true
//         const updatedProduct = await productSchema.findByIdAndUpdate(
//             id,
//             { isActive: true },
//             { new: true }
//         );

//         if (!updatedProduct) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Redirect back to product management page
//         res.redirect('/admin/editProduct?success=true');
//     } catch (error) {
//         console.error('Error listing product:', error);
//         res.redirect('/admin/editProduct?error=true');
//     }
// };

// // //--------------------------------------------- Unlist a Product ---------------------------
// const unlistProduct = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Find the product by ID and update its isActive status to false
//         const updatedProduct = await productSchema.findByIdAndUpdate(
//             id,
//             { isActive: false },
//             { new: true }
//         );

//         if (!updatedProduct) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Redirect back to product management page
//         res.redirect('/admin/editProduct?success=true');
//     } catch (error) {
//         console.error('Error unlisting product:', error);
//         res.redirect('/admin/editProduct?error=true');
//     }
// };


// // Render form to edit a product
// const getUpdateProduct = async (req, res) => {
//     const productId = req.params.id;

//     try {
//         const product = await productSchema.findById(productId);
//         const categories = await categorySchema.find({ isDeleted: false });
       

//         res.render('admin/Productindlist', { product, categories });
//     } catch (error) {
//         console.error('Error fetching product for editing:', error);
//         res.status(500).send('Server Error');
//     }
// };

// // Edit a product
// const postEditProduct = async (req, res) => {
//     const productId = req.params.id;
//     const removedImages = JSON.parse(req.body.removedImages || '[]');
//     const newImages = req.files;
    
//     console.log("Received product ID:", productId);
//     console.log("Removed Images:", removedImages);
//     console.log("New Images:", newImages);
    
//     try {
//         let product = await productSchema.findById(productId);
//         if (!product) {
//             console.log("Product not found.");
//             return res.status(404).json({ message: 'Product Not Found!' });
//         }
//         console.log("Product found:", product);
        
//         // Update product fields
//         Object.assign(product, req.body); 
//         console.log("Updated product fields:", product);
        
//         // Handle removed images
//         if (removedImages.length > 0) {
//             console.log("Handling removed images...");
//             product.imgArray = product.imgArray.filter(img => !removedImages.includes(img));
//             console.log("Updated imgArray after removal:", product.imgArray);
            
//             // Delete removed images from the server
//             removedImages.forEach(image => {
//                 const filePath = path.join('uploads', image);
//                 console.log(`Checking if file exists at ${filePath}`);
//                 if (fs.existsSync(filePath)) {
//                     console.log(`Deleting file: ${filePath}`);
//                     fs.unlinkSync(filePath);
//                 } else {
//                     console.log(`File not found: ${filePath}`);
//                 }
//             });
//         }

//         if (newImages && newImages.length > 0) {
//             console.log("Handling new images...");
//             newImages.forEach(file => {
//                 console.log(`Adding new image: ${file.filename}`);
//                 product.imgArray.push(file.filename);
//             });
//         }
    
//         // Recalculate finalPrice based on discount, if needed
//         if (product.discount > 0) {
//             product.finalPrice = product.price * (1 - product.discount / 100);
//             console.log(`Discount applied. Final Price: ${product.finalPrice}`);
//         } else {
//             product.finalPrice = product.price;
//             console.log(`No discount applied. Final Price: ${product.finalPrice}`);
//         }

//         // Save the updated product
//         await product.save();
//         console.log("Product saved successfully.");
//         res.status(200).json({ message: 'Product Updated Successfully' });
//     } catch (error) {
//         console.error('Error updating product:', error);
//         res.status(500).json({ message: 'An error occurred while updating the product!' });
//     }
// };


// module.exports = {
//     getProduct,
//     addProduct,
//     postEditProduct,
//     getUpdateProduct ,
//     geteditProduct,
//     listProduct,
//     unlistProduct 

  
// };


// ====================
// Product Controller
// ====================
const path = require('path');
const fs = require('fs');
const category = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');

// Get all products with pagination
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [products, totalProducts] = await Promise.all([
            productSchema.find()
                .populate('category')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            productSchema.countDocuments()
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', { products, currentPage: page, totalPages, limit });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Render form to add a new product
exports.getAddProduct = async (req, res) => {
    try {
        const categories = await category.find({ isDeleted: false });
        res.render('admin/addProduct', { categories });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Add a new product
exports.postAddProduct = async (req, res) => {
    try {
        // Log the incoming request body
        console.log('Request Body:', req.body);

        const {
            productName, description, price, discount = 0, stock, category
        } = req.body;

        // Log parsed input values
        console.log('Parsed Input Values:');
        console.log('Product Name:', productName);
        console.log('Description:', description);
        console.log('Price:', price);
        console.log('Discount:', discount);
        console.log('Stock:', stock);
        console.log('Category:', category);

        if (price < 0 || stock < 0) {
            console.log('Invalid Price or Stock. Must be non-negative.');
            return res.status(400).json({ message: 'Price and Stock must be non-negative' });
        }

        // Log uploaded files
        console.log('Uploaded Files:', req.files);

        const images = req.files.map(file => file.filename);
        console.log('Mapped Images Array:', images);

        const finalPrice = price - (price * (discount / 100));
        console.log('Calculated Final Price:', finalPrice);

        const newProduct = new productSchema({
            name: productName,
            description,
            price,
            discount,
            stock,
            category,
            imgArray: images,
            finalPrice
        });

        // Log the new product object
        console.log('New Product Object:', newProduct);

        await newProduct.save();

        console.log('Product successfully added to the database.');
        res.status(200).json({ success: true, message: 'Product Successfully Added!' });
    } catch (error) {
        // Log any errors that occur
        console.error('Failed to add product:', error);
        res.status(500).json({ message: 'Failed to add Product' });
    }
};

exports.BlockUnblock = async (req, res) => {
    const productId = req.params.id;
    const { active } = req.body;

    try {
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.isActive = active; // Set active status
        await product.save();

        res.status(200).json({ message: active ? 'Product unblocked' : 'Product blocked', product });
    } catch (error) {
        console.error('Error blocking/unblocking product:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Render form to edit a product
exports.getUpdateProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        const product = await productSchema.findById(productId);
        const categories = await category.find({ isDeleted: false });

        res.render('admin/editProduct', { product, categories });
    } catch (error) {
        console.error('Error fetching product for editing:', error);
        res.status(500).send('Server Error');
    }
};

// Edit a product
exports.postEditProduct = async (req, res) => {
    const productId = req.params.id;
    const removedImages = JSON.parse(req.body.removedImages || '[]');
    const newImages = req.files;

    try {
        let product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product Not Found!' });
        }

        Object.assign(product, req.body);

        if (removedImages.length > 0) {
            product.imgArray = product.imgArray.filter(img => !removedImages.includes(img));
            removedImages.forEach(image => {
                const filePath = path.join('uploads', image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        if (newImages && newImages.length > 0) {
            newImages.forEach(file => {
                product.imgArray.push(file.filename);
            });
        }

        product.finalPrice = product.price - (product.price * (product.discount / 100));

        await product.save();
        res.status(200).json({ message: 'Product Updated Successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'An error occurred while updating the product!' });
    }
};
