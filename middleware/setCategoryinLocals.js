// ==========================
// Load Categories Middleware
// ==========================

const category = require(`../model/categorySchema`);

const loadCategoriesMiddleware = async (req, res, next) => {
    try {
        // Retrieve unblocked categories and make available in views
        const categories = await category.find({  isDeleted: false });
        res.locals.categories = categories;
        next();
    } catch (error) {
        console.error('Error fetching categories:', error);
        next();
    }
};

module.exports = loadCategoriesMiddleware;