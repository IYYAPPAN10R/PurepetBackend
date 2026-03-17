const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// POST /api/orders  — any authenticated or guest user
exports.createOrder = async (req, res) => {
    try {
        const { customerName, companyName, email, phone, address, orderNotes, items } = req.body;

        if (!customerName || !email || !address || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Customer name, email, address and at least one item are required.' });
        }

        // 1. Validate Stock Availability & Prepare Deductions
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.productName} not found.` });
            }
            if (product.countInStock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.name}. Available: ${product.countInStock}` 
                });
            }
        }

        // 2. Actually Deduct Stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { countInStock: -item.quantity },
                // We'll calculate the new inStock in the next step or just trust countInStock logic added to controllers
            });
            // Update inStock status manually here to be safe
            const updatedProduct = await Product.findById(item.productId);
            updatedProduct.inStock = updatedProduct.countInStock > 0;
            await updatedProduct.save();
        }

        const order = await Order.create({
            userId: req.user?._id || null,
            customerName,
            companyName: companyName || '',
            email,
            phone: phone || '',
            address,
            orderNotes: orderNotes || '',
            items,
        });

        // Fire and forget admin notification email
        const sendAdminNotification = async () => {
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
                if (!adminEmail) return;

                // Fetch accurate product prices to calculate the total amount
                const productIds = items.map(item => item.productId);
                const products = await Product.find({ _id: { $in: productIds } });

                let totalAmount = 0;
                let itemsHtmlRows = '';

                items.forEach(item => {
                    const productDb = products.find(p => p._id.toString() === item.productId.toString());
                    const price = productDb?.price || 199; // Default fallback to match storefront
                    const itemTotal = price * item.quantity;
                    totalAmount += itemTotal;

                    itemsHtmlRows += `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${item.productName} (${item.capacity || 'N/A'})</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${price}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${itemTotal}</td>
                        </tr>
                    `;
                });

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">New Order Received</h2>
                        <p><strong>Order ID:</strong> #${order._id}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        
                        <h3 style="margin-top: 30px; color: #333;">Customer Details:</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
                        ${order.companyName ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${order.companyName}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${order.email}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                        
                        <h3 style="margin-top: 20px; color: #333;">Shipping Address:</h3>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 5px;">${order.address}</p>

                        ${order.orderNotes ? `
                        <h3 style="margin-top: 20px; color: #333;">Order Notes:</h3>
                        <p style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 5px; color: #856404;">${order.orderNotes}</p>
                        ` : ''}
                        
                        <h3 style="margin-top: 30px; color: #333;">Ordered Products:</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtmlRows}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="padding: 15px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 16px;">Total Amount:</td>
                                    <td style="padding: 15px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 16px; color: #2E7D32;">₹${totalAmount}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
                            <p>This is an automated message from the PurePet Solutions system.</p>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: adminEmail,
                    subject: `New Order Received - #${order._id.toString().substring(0, 8).toUpperCase()}`,
                    html: emailHtml
                });

            } catch (emailErr) {
                console.error('Failed to send order notification:', emailErr);
            }
        };

        sendAdminNotification();

        res.status(201).json({ success: true, message: 'Order placed successfully!', order });
    } catch (err) {
        console.error('createOrder error:', err);
        res.status(500).json({ success: false, message: 'Failed to place order.' });
    }
};

// GET /api/orders  — admin only
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;

        const filter = status && status !== 'all' ? { status } : {};

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name email');

        res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('getOrders error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
};

// PUT /api/orders/:id  — admin only
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const orderBeforeUpdate = await Order.findById(req.params.id);
        if (!orderBeforeUpdate) return res.status(404).json({ success: false, message: 'Order not found.' });

        // If transitioning TO cancelled FROM something else, restore stock
        if (status === 'cancelled' && orderBeforeUpdate.status !== 'cancelled') {
            for (const item of orderBeforeUpdate.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.countInStock += item.quantity;
                    product.inStock = product.countInStock > 0;
                    await product.save();
                }
            }
        } 
        // If transitioning FROM cancelled TO something else, deduct stock again
        else if (status !== 'cancelled' && orderBeforeUpdate.status === 'cancelled') {
            // Check stock first
            for (const item of orderBeforeUpdate.items) {
                const product = await Product.findById(item.productId);
                if (!product || product.countInStock < item.quantity) {
                    return res.status(400).json({ success: false, message: `Cannot restore order status. Insufficient stock for ${item.productName}.` });
                }
            }
            // Deduct
            for (const item of orderBeforeUpdate.items) {
                const product = await Product.findById(item.productId);
                product.countInStock -= item.quantity;
                product.inStock = product.countInStock > 0;
                await product.save();
            }
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update order.' });
    }
};

// DELETE /api/orders/:id — admin only
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Restore stock if it wasn't already cancelled
        if (order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.countInStock += item.quantity;
                    product.inStock = product.countInStock > 0;
                    await product.save();
                }
            }
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order deleted and stock restored.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete order.' });
    }
};
