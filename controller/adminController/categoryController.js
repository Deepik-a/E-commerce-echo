const categorySchema = require('../../model/categorySchema');

// Add a category
const addCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Check if category already exists
        const existingCategory = await categorySchema.findOne({ name });

        if (existingCategory) {
            // Send error response if category already exists
            return res.status(400).json({ message: 'Category already exists' });
        }
        const newCategory = new categorySchema({ name });
        await newCategory.save();
        
        // Send success response
        return res.status(200).json({ message: 'Category added successfully' });
    } catch (error) {
        console.log(`Error while adding category: ${error}`);
        // Send error response
        return res.status(500).json({ message: 'Failed to add category' });
    }
};




const geteditCategories =async(req, res) => {
    try {
const categories = await categorySchema.find({});
        res.render('admin/Categorylist',{categories})
      
    } catch (error) {
        console.error('Error rendering edit category page:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Edit a category
const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Update the category by ID
        const updatedCategory = await categorySchema.findByIdAndUpdate(id, { name }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Send JSON response on successful update
        res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });

    } catch (error) {
        console.log(`Error while editing category: ${error}`);
        
        // Send JSON response on error
        res.status(500).json({ message: 'An error occurred while updating the category' });
   
    }
};


// Render the edit form for a specific category
const renderEditCategoryForm = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categorySchema.findById(id);

        if (!category) {
            return res.status(404).send('Category not found');
        }

        // Render the edit category form and pass the category details
        res.render('admin/editCategory', { category });
    } catch (error) {
        console.error('Error rendering edit category form:', error);
        res.status(500).send('Internal Server Error');
    }
};




// Block a category
const blockCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find the category by ID and update isDeleted to true (blocked)
    const category = await categorySchema.findByIdAndUpdate(
      categoryId,
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category blocked', category });
  } catch (error) {
    return res.status(500).json({ message: 'Error blocking category', error });
  }
};

// Unblock a category
const unblockCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find the category by ID and update isDeleted to false (unblocked)
    const category = await categorySchema.findByIdAndUpdate(
      categoryId,
      { isDeleted: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category unblocked', category });
  } catch (error) {
    return res.status(500).json({ message: 'Error unblocking category', error });
  }
};



const getCategoriesForUser = async (req, res) => {

    try {
      
        const categories = await categorySchema.find({ isDeleted: false });
        res.json(categories); // This sets the content type to application/json
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
};





module.exports = {
    addCategory,
    editCategory,
    renderEditCategoryForm,
    geteditCategories,
    getCategoriesForUser,
    blockCategory,
    unblockCategory 
  
};
