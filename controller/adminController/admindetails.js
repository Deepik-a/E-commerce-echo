

const User = require('../../model/userSchema');
const Order = require('../../model/orderSchema');
const chort = require('chart.js')
const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
require('dotenv').config();


exports.dashboardGet = async (req, res) => {
    try {

        const currentDate = new Date();
        const selectedYear = parseInt(req.query.year) || currentDate.getFullYear();
        const selectedMonth = parseInt(req.query.month) || (currentDate.getMonth() + 1);
        const selectedPeriod = req.query.period || 'daily';

        // Generate date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);

        // Daily Sales Data
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Daily User Registrations
        const dailyUsers = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top 5 Products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$items.productId',
                    totalQuantity: { $sum: '$items.productCount' },
                    totalRevenue: { $sum: { $multiply: ['$items.productCount', '$items.productPrice'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        // Top 5 Categories
        const topCategories = await Order.aggregate([
            { $unwind: '$items' },
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalQuantity: { $sum: '$items.productCount' },
                    totalRevenue: { $sum: { $multiply: ['$items.productCount', '$items.productPrice'] } }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        const user = await User.find()

        // Generate years and months for dropdowns
        const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        // Total Statistics
        const totalStats = {
            totalRevenue: dailySales.reduce((sum, day) => sum + day.totalRevenue, 0),
            totalOrders: dailySales.reduce((sum, day) => sum + day.totalOrders, 0),
            totalUsers: user.length
        };

        // Render Dashboard
        res.render('admin/dasshbord', {
            dailySales,
            dailyUsers,
            topProducts,
            topCategories,
            selectedYear,
            selectedMonth,
            selectedPeriod,
            years,
            months,
            totalStats
        });
    } catch (error) {

        res.status(500).send('Error loading dashboard');
    }
};




