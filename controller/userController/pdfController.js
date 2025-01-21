const PDFDocument = require('pdfkit');
const Order = require('../../model/orderSchema');


exports.generateOrderPDF = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch the order by ID and populate the product details
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
        });

        // PDF Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}.pdf`);
        doc.pipe(res);

        // Order Header
        doc.fontSize(20)
            .text('Order Summary', { align: 'center' })
            .moveDown(2);

        // Order Details
        doc.fontSize(12)
            .text(`Order ID: ${order.orderId}`)
            .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
            .text(`Order Status: ${order.status}`)
            .text(`Payment Method: ${order.paymentMethod}`)
            .text(`Total Items: ${order.totalQuantity}`)
            .text(`Payable Amount: ₹${order.payableAmount}`)
            .moveDown(2);

        // Shipping Address
        doc.fontSize(14)
            .text('Shipping Address', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .text(order.address)
            .moveDown(2);

        // Items Table
        doc.fontSize(14)
            .text('Items Purchased', { underline: true })
            .moveDown(1);

        const tablePositions = {
            product: 50,
            quantity: 200,
            price: 300,
            total: 450,
        };

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(12)
            .text('Product', tablePositions.product, tableTop)
            .text('Quantity', tablePositions.quantity, tableTop)
            .text('Price', tablePositions.price, tableTop)
            .text('Total', tablePositions.total, tableTop);

        // Underline Header
        doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .stroke();

        // Start items below the header
        let yPosition = tableTop + 25;

        // Items Rows
        order.items.forEach((item) => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            const productName = item.productId ? item.productId.name : 'Product not found';

            doc.fontSize(12)
                .text(productName, tablePositions.product, yPosition, { width: 140, ellipsis: true }) // Ensure product names fit
                .text(item.productCount.toString(), tablePositions.quantity, yPosition)
                .text(`₹${item.productPrice}`, tablePositions.price, yPosition)
                .text(`₹${item.productPrice * item.productCount}`, tablePositions.total, yPosition);

            yPosition += 30;
        });

        // Add spacing before the total amount
        yPosition += 20;

        // Total Amount
        doc.fontSize(14)
            .text(`Total Amount: ₹${order.payableAmount}`, 400, yPosition, { align: 'right' })
            .moveDown(2);

        // Footer
        doc.fontSize(10)
            .text('Thank you for your order!', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error(`PDF Generation Error: ${error.message}`);
        res.status(500).json({
            message: 'Failed to generate PDF',
            error: error.message,
        });
    }
};
