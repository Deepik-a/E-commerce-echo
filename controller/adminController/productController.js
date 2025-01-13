
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
