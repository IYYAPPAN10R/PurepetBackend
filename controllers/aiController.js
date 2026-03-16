const Product = require('../models/Product');
const User = require('../models/User');

// Knowledge base for PurePet chatbot
const chatbotKB = [
    {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        response: "Hello! Welcome to PurePet Solutions! 👋 I'm your virtual assistant. How can I help you today? You can ask me about our products, sustainability practices, pricing inquiries, or anything else!",
    },
    {
        keywords: ['price', 'cost', 'rate', 'quote', 'pricing'],
        response: '💰 Pricing depends on product type, capacity, quantity, and customization. For accurate pricing, please use our Contact form or email sales@purepet.com. Bulk orders get special discounts!',
    },
    {
        keywords: ['material', 'pet', 'plastic', 'quality', 'grade'],
        response: '🏭 We use FDA-grade PET (Polyethylene Terephthalate) material for all our bottles. Our PET is BPA-free, food-safe, and meets international quality standards (ISO 9001:2015).',
    },
    {
        keywords: ['custom', 'design', 'mold', 'shape', 'logo', 'branding'],
        response: '🎨 Yes! We offer full custom mold design and development. From unique shapes to your brand logo embossing — our design team can bring your vision to life. Contact us for a FREE consultation!',
    },
    {
        keywords: ['eco', 'sustainable', 'environment', 'recycle', 'green', 'biodegradable'],
        response: '🌱 Sustainability is our core value! We use 30% recycled PET, solar-powered manufacturing, and a zero-waste-to-landfill policy. All our bottles are 100% recyclable. We\'re ISO 14001 certified!',
    },
    {
        keywords: ['capacity', 'size', 'ml', 'liter', 'litre', 'volume'],
        response: '📦 We manufacture bottles from 50ml to 20 Liters. Popular sizes: 200ml, 500ml, 1L, 1.5L, 2L, 5L, 10L. Custom capacities available on request!',
    },
    {
        keywords: ['delivery', 'shipping', 'lead time', 'timeline', 'when'],
        response: '🚚 Standard lead time is 15-21 business days for new orders. For repeat orders, 7-10 days. We ship PAN India and export globally. Express delivery available for urgent requirements.',
    },
    {
        keywords: ['minimum', 'moq', 'minimum order', 'bulk'],
        response: '📊 Our Minimum Order Quantity (MOQ) starts at 5,000 units for standard products and 10,000 units for custom designs. We also offer smaller pilot batches for sampling purposes.',
    },
    {
        keywords: ['contact', 'phone', 'email', 'address', 'location', 'office'],
        response: '📞 Contact us: \n📧 Email: info@purepet.com\n📱 Phone: +91 98765 43210\n📍 Address: PurePet Solutions, Industrial Area, Phase II, Mumbai - 400001',
    },
    {
        keywords: ['certificate', 'iso', 'fda', 'brc', 'certification', 'standard'],
        response: '🏆 PurePet Solutions holds multiple certifications:\n• ISO 9001:2015 (Quality Management)\n• ISO 14001:2015 (Environmental)\n• FDA Approved Grade Materials\n• BRC Packaging Standard',
    },
];

const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();

    for (const item of chatbotKB) {
        if (item.keywords.some((kw) => msg.includes(kw))) {
            return item.response;
        }
    }

    return "I'm not sure about that specific query. 🤔 Please feel free to contact our team directly at info@purepet.com or call +91 98765 43210. You can also fill out our Contact form and we'll respond within 24 hours!";
};

// @desc   AI Chatbot response
// @route  POST /api/ai/chat
// @access Public
exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

        const msgLower = message.toLowerCase();

        // Product detection criteria
        const productIntentKeywords = ['bottle', 'show', 'details', 'have', 'recommend', 'ml', 'liter', 'l', 'premium', 'sports', 'cheap', 'price', 'water', 'buy', 'cart', 'small', 'large', 'big', 'square', 'round', 'color', 'blue', 'red', 'green', 'black', 'white', 'clear', 'transparent'];
        const colors = ['blue', 'red', 'green', 'black', 'white', 'clear', 'transparent', 'yellow', 'brown'];
        const shapes = ['square', 'round', 'short', 'tall', 'small', 'large', 'big'];
        const categories = ['water', 'beverage', 'pharma', 'food', 'chemical', 'custom'];

        // Exact sizes detection 
        const capacityMatch = msgLower.match(/\b(\d+ml|\d+\.?\d*l)\b/i);
        const hasIntent = productIntentKeywords.some(kw => msgLower.includes(kw));

        if (hasIntent || capacityMatch) {
            let query = { inStock: true };
            let sortQuery = '-createdAt';

            const stopWords = ['tell', 'me', 'about', 'the', 'a', 'an', 'of', 'do', 'you', 'have', 'show', 'details', 'bottle', 'bottles', 'for', 'is', 'what', 'can', 'under', 'cheap', 'price', 'water', 'recommend', 'with', 'shape', 'color', 'size'];
            let words = msgLower.split(/[\s,?!.]+/).filter(w => w.length > 2 && !stopWords.includes(w) && w !== (capacityMatch ? capacityMatch[0] : ''));

            const andConditions = [];

            if (capacityMatch) {
                andConditions.push({ capacity: { $regex: capacityMatch[0], $options: 'i' } });
            }

            const colorMatch = colors.find(c => msgLower.includes(c));
            if (colorMatch) {
                andConditions.push({ color: { $regex: colorMatch, $options: 'i' } });
                words = words.filter(w => w !== colorMatch);
            }

            const shapeMatch = shapes.find(s => msgLower.includes(s));
            if (shapeMatch) {
                andConditions.push({
                    $or: [
                        { dimensions: { $regex: shapeMatch, $options: 'i' } },
                        { description: { $regex: shapeMatch, $options: 'i' } },
                        { name: { $regex: shapeMatch, $options: 'i' } }
                    ]
                });
                words = words.filter(w => w !== shapeMatch);
            }

            const categoryMatch = categories.find(c => msgLower.includes(c));
            if (categoryMatch) {
                andConditions.push({ category: categoryMatch });
                words = words.filter(w => w !== categoryMatch);
            }

            if (words.length > 0) {
                const regexes = words.map(w => ({
                    $or: [
                        { name: { $regex: w, $options: 'i' } },
                        { description: { $regex: w, $options: 'i' } },
                        { tags: { $regex: w, $options: 'i' } }
                    ]
                }));
                // Try matching at least some generic text if present
                andConditions.push({ $and: regexes });
            }

            if (andConditions.length > 0) {
                query.$and = andConditions;
            }

            if (msgLower.includes('cheap') || msgLower.includes('under')) {
                sortQuery = 'price';
            }

            // Find matching product
            let products = await Product.find(query).sort(sortQuery).limit(3);

            const formatProduct = (p) => ({
                _id: p._id,
                name: p.name,
                features: p.features && p.features.length > 0 ? p.features : ['Leak-proof cap', 'Durable PET material', 'Lightweight design'],
                capacity: p.capacity,
                material: p.material,
                color: p.color,
                dimensions: p.dimensions,
                category: p.category,
                price: p.price || 199,
                description: p.description,
                image: p.image && p.image.trim() !== '' ? p.image : ''
            });

            if (products.length > 0) {
                return res.status(200).json({
                    success: true,
                    response: "Here is what I found for you! Let me know if you need any other details.",
                    products: products.map(formatProduct)
                });
            } else {
                // Try fallback
                let fallback = await Product.find({ inStock: true }).sort('-createdAt').limit(3);
                if (fallback.length > 0) {
                    return res.status(200).json({
                        success: true,
                        response: "Sorry, I couldn't find an exact match for that product. Here are some similar items you might like!",
                        products: fallback.map(formatProduct)
                    });
                }
            }
        }

        // Standard knowledge base if not a specific product match
        const response = getBotResponse(message);
        res.status(200).json({ success: true, response });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Product recommendations based on viewed products
// @route  GET /api/ai/recommendations
// @access Private
exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('viewedProducts');

        if (!user.viewedProducts || user.viewedProducts.length === 0) {
            // Return popular products if no history
            const popular = await Product.find({ inStock: true }).limit(4);
            return res.status(200).json({ success: true, recommendations: popular, basis: 'popular' });
        }

        // Get categories the user has viewed
        const viewedCategories = [...new Set(user.viewedProducts.map((p) => p.category))];
        const viewedIds = user.viewedProducts.map((p) => p._id);

        // Find products in similar categories the user hasn't viewed yet
        const recommendations = await Product.find({
            category: { $in: viewedCategories },
            _id: { $nin: viewedIds },
            inStock: true,
        }).limit(4);

        // If not enough, pad with any other products
        if (recommendations.length < 4) {
            const extra = await Product.find({
                _id: { $nin: [...viewedIds, ...recommendations.map((r) => r._id)] },
                inStock: true,
            }).limit(4 - recommendations.length);
            recommendations.push(...extra);
        }

        res.status(200).json({ success: true, recommendations, basis: 'browsing-history' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
