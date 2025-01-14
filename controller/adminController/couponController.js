const Coupon = require('../../model/couponSchema');

//------------------------------------- Get all coupons ---------------------------

const getCoupons = async (req, res) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit; 

    try {
        if (req.params.id) {
            const coupon = await Coupon.findById(req.params.id);
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            return res.json(coupon);
        }

      
        const coupons = await Coupon.find({ code: { $regex: search, $options: 'i' } })
            .skip(skip)
            .limit(limit);

        
        const count = await Coupon.countDocuments({ code: { $regex: search, $options: 'i' } });

  
        const totalPages = Math.ceil(count / limit);

        // Render the page with pagination data
        res.render('admin/coupons', {
            coupons,
            title: 'Coupons',
            currentPage: page,
            totalPages: totalPages,
            search
        });
    } catch (error) {
        console.log(`Error while rendering coupon page: ${error}`);
        res.status(500).json({ message: 'Error fetching coupon data' });
    }
};

//--------------------------------- Add a new coupon -----------------------------

const addCoupon = async (req, res) => {
    console.log("enterredvadd coupon")
    const { code, discountType, discountValue, maxDiscountAmount, startDate, endDate, minimumOrderAmount,usageCount } = req.body;
console.log(req.body,"req.body of add coupon ")
    // Validation: Check if all required fields are present
    if (!code || !discountType || !discountValue || !startDate || !endDate || !minimumOrderAmount ||!usageCount) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validation: Ensure maxDiscountAmount is provided for Percentage discount type
    if (discountType === 'Percentage' && (maxDiscountAmount === undefined || maxDiscountAmount <= 0)) {
        return res.status(400).json({ message: 'For percentage discounts, maxDiscountAmount must be greater than 0' });
    }

    try {
        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        // Create a new coupon with the provided data
        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            maxDiscountAmount,  // Save maxDiscountAmount for percentage-based coupons
            startDate,
            endDate,
            minimumOrderAmount,
            usageCount
        });

        // Save the new coupon
        await newCoupon.save();
        res.json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'Error adding coupon' });
    }
};



//------------------------------------- Edit a coupon ----------------------------

const editCoupon = async (req, res) => {
    const { id, code, discountType, discountValue, startDate, endDate, minimumOrderAmount,usageCount } = req.body;
    if (!id || !code || !discountType || !discountValue || !startDate || !endDate || !minimumOrderAmount || !usageCount === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id, { code, discountType, discountValue, startDate, endDate, minimumOrderAmount,usageCount }, { new: true }
        );
        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json({ message: 'Coupon updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating coupon' });
    }
};


//----------------------------- Toggle coupon status ----------------------------

const toggleCouponStatus = async (req, res) => {
    const couponId = req.query.id;
    const status = req.query.status === 'true';
    try {
        await Coupon.findByIdAndUpdate(couponId, { isActive: !status });
        req.flash('error','Coupon status updated successfully')
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log(`Error while changing status: ${error}`);
        res.flash('error' ,'Error updating coupon status' );
    }
};

//--------------------------------- Delete a coupon ------------------------------

const deleteCoupon = async (req, res) => {
    const { id } = req.params;
    try {
        await Coupon.findByIdAndDelete(id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon' });
    }
};



module.exports = { getCoupons , addCoupon , editCoupon , toggleCouponStatus , deleteCoupon}