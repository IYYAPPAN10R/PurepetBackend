const Product = require('../models/Product');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc   Get all products (with filtering & pagination)
// @route  GET /api/products
// @access Public
exports.getProducts = async (req, res) => {
    try {
        const { category, inStock, search, page = 1, limit = 12 } = req.query;
        const query = {};

        if (category && category !== 'all') query.category = category;
        if (inStock !== undefined) query.inStock = inStock === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page),
            products,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Get a single product
// @route  GET /api/products/:id
// @access Public
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        // Track this product in user's viewed if logged in
        if (req.user) {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { viewedProducts: product._id },
            });
        }

        res.status(200).json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Create a product
// @route  POST /api/products
// @access Private/Admin
exports.createProduct = async (req, res) => {
    try {
        // Auto-set inStock based on countInStock
        if (req.body.countInStock !== undefined) {
            req.body.inStock = req.body.countInStock > 0;
        }

        const product = await Product.create(req.body);

        // Notify all users asynchronously
        const notifyUsers = async () => {
            try {
                const users = await User.find({}).select('email');
                if (users && users.length > 0) {
                    const emails = users.map(u => u.email).filter(e => e);
                    const uniqueEmails = [...new Set(emails)];

                    if (uniqueEmails.length > 0) {
                        const clientUrl = process.env.CLIENT_URL || 'https://purepetfrontend.onrender.com';
                        const productUrl = `${clientUrl}/products`;

                        const priceDisplay = req.body.price ? `$${req.body.price}` : 'Contact for Pricing';

                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0;">New Product Alert! 🚀</h2>
                                </div>
                                <div style="padding: 20px;">
                                    <h3 style="color: #333;">${product.name}</h3>
                                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px;">` : ''}
                                    <p style="color: #555; line-height: 1.6;">${product.description}</p>
                                    <p style="font-size: 18px; font-weight: bold; color: #2E7D32;">Price: ${priceDisplay}</p>
                                    <div style="text-align: center; margin-top: 25px;">
                                        <a href="${productUrl}" style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">View Products</a>
                                    </div>
                                </div>
                                <div style="background-color: #f5f5f5; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                                    <p>You are receiving this email because you are a registered user at PurePet Solutions.</p>
                                </div>
                            </div>
                        `;

                        await sendEmail({
                            to: process.env.FROM_EMAIL || process.env.SMTP_USER,
                            bcc: uniqueEmails,
                            subject: `New Product Added: ${product.name}`,
                            html: emailHtml
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to notify users about new product:', error);
            }
        };

        notifyUsers();

        res.status(201).json({ success: true, message: 'Product created!', product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc   Update a product
// @route  PUT /api/products/:id
// @access Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        const productBeforeUpdate = await Product.findById(req.params.id);
        if (!productBeforeUpdate) return res.status(404).json({ success: false, message: 'Product not found.' });

        // Auto-set inStock based on countInStock
        if (req.body.countInStock !== undefined) {
            req.body.inStock = Number(req.body.countInStock) > 0;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Check if item just went out of stock
        if (product.countInStock === 0 && productBeforeUpdate.countInStock > 0) {
            const notifyOutOfStock = async () => {
                try {
                    const users = await User.find({}).select('email');
                    const emails = users.map(u => u.email).filter(e => e);
                    const uniqueEmails = [...new Set(emails)];

                    if (uniqueEmails.length > 0) {
                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                    <h2 style="margin: 0;">Stock Update: ${product.name}</h2>
                                </div>
                                <div style="padding: 20px; text-align: center;">
                                    <h3>I am out of stock, but I will be back soon!</h3>
                                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="max-width: 150px; margin: 20px 0;">` : ''}
                                    <p style="color: #666;">We've temporarily run out of <strong>${product.name}</strong>. Don't worry, we are working hard to restock it as quickly as possible!</p>
                                    <p style="color: #888; font-size: 14px;">We'll notify you once it's available again.</p>
                                </div>
                            </div>
                        `;

                        await sendEmail({
                            to: process.env.FROM_EMAIL || process.env.SMTP_USER,
                            bcc: uniqueEmails,
                            subject: `Update: ${product.name} is currently Out of Stock`,
                            html: emailHtml
                        });
                        console.log(`Out of stock notification sent for ${product.name}`);
                    }
                } catch (err) {
                    console.error('Failed to send out of stock notification:', err);
                }
            };
            notifyOutOfStock();
        }

        res.status(200).json({ success: true, message: 'Product updated!', product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc   Delete a product
// @route  DELETE /api/products/:id
// @access Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
