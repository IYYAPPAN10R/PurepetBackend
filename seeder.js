const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');

const products = [
    {
        name: 'AquaSlim 500ml',
        capacity: '500ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'PurePet\'s most popular bottle, perfect for drinking water, juices, and soft drinks. Slim ergonomic design with superior clarity.',
        category: 'water',
        features: ['BPA-Free', 'Food-Grade PET', 'Lightweight', 'High Clarity', '100% Recyclable'],
        inStock: true,
        weight: '18g',
        dimensions: 'Ø65mm x H205mm',
        color: 'Clear / Transparent',
        tags: ['water', '500ml', 'slim', 'popular'],
    },
    {
        name: 'HydroMax 1L Wide Mouth',
        capacity: '1000ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Wide-mouth 1-liter bottle ideal for sports, energy drinks, and juices. Easy-grip texture and wide opening for easy cleaning.',
        category: 'water',
        features: ['Wide Mouth', 'Easy-Grip', 'BPA-Free', 'Pressure-Resistant', '100% Recyclable'],
        inStock: true,
        weight: '28g',
        dimensions: 'Ø80mm x H230mm',
        color: 'Clear / Transparent',
        tags: ['water', '1L', 'sports', 'wide-mouth'],
    },
    {
        name: 'BeveraGo 250ml',
        capacity: '250ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Compact single-serve bottle ideal for juices, flavored water, and soft drinks. Perfect for retail packaging.',
        category: 'beverage',
        features: ['BPA-Free', 'Tamper-Evident', 'Lightweight', 'Retail-Ready'],
        inStock: true,
        weight: '12g',
        dimensions: 'Ø53mm x H155mm',
        color: 'Clear / Transparent',
        tags: ['beverage', '250ml', 'juice', 'compact'],
    },
    {
        name: 'PharmaSafe 100ml',
        capacity: '100ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Child-resistant pharma-grade PET bottle for syrups, vitamins, and liquid medicines. FDA-approved material.',
        category: 'pharma',
        features: ['Child-Resistant Cap', 'FDA-Approved', 'Anti-Static', 'UV-Protected', 'Tamper-Evidence'],
        inStock: true,
        weight: '10g',
        dimensions: 'Ø40mm x H120mm',
        color: 'Amber / Brown',
        tags: ['pharma', '100ml', 'medicine', 'FDA'],
    },
    {
        name: 'FoodGuard 500ml Jar',
        capacity: '500ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Wide-mouth jar for dry foods, spices, pickles, and sauces. Excellent moisture barrier and food-grade compliance.',
        category: 'food',
        features: ['Wide Mouth Jar', 'Moisture Barrier', 'Food-Safe', 'Airtight Seal', 'Microwave-Safe'],
        inStock: true,
        weight: '30g',
        dimensions: 'Ø90mm x H170mm',
        color: 'Clear / Transparent',
        tags: ['food', 'jar', 'spices', 'pickle'],
    },
    {
        name: 'ChemShield 5L Carboy',
        capacity: '5000ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Heavy-duty 5L carboy for industrial chemicals, cleaning solutions, and lab reagents. Reinforced base for stability.',
        category: 'chemical',
        features: ['Chemical-Resistant', 'Heavy-Duty', 'Leak-Proof', 'HDPE Cap Compatible', 'Stacking Design'],
        inStock: true,
        weight: '120g',
        dimensions: 'Ø200mm x H380mm',
        color: 'Natural / Semi-Opaque',
        tags: ['chemical', '5L', 'industrial', 'heavy-duty'],
    },
    {
        name: 'EcoFlex 1.5L',
        capacity: '1500ml',
        material: 'rPET (Recycled PET)',
        image: '',
        description: '1.5L bottle made with 30% recycled PET. Our sustainability flagship product. Reduced carbon footprint without compromising quality.',
        category: 'water',
        features: ['30% rPET', 'Eco-Friendly', 'BPA-Free', 'Carbon-Reduced', 'Fully Recyclable'],
        inStock: true,
        weight: '32g',
        dimensions: 'Ø75mm x H290mm',
        color: 'Slight Tint (Eco)',
        tags: ['eco', 'recycled', '1.5L', 'sustainable', 'rPET'],
    },
    {
        name: 'SlimFit 200ml',
        capacity: '200ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Elegant slim 200ml bottle for premium juices, flavored waters, and kids beverages. Eye-catching design boosts retail shelf appeal.',
        category: 'beverage',
        features: ['Slim Design', 'Premium Look', 'BPA-Free', 'Shrink-Label Ready', 'Bright Clarity'],
        inStock: true,
        weight: '9g',
        dimensions: 'Ø45mm x H140mm',
        color: 'Crystal Clear',
        tags: ['beverage', '200ml', 'slim', 'premium', 'kids'],
    },
    {
        name: 'MegaCask 10L',
        capacity: '10000ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: '10-litre large-format bottle for water dispensers, industrial use, and bulk packaging. Heavy-gauge PET for maximum durability.',
        category: 'water',
        features: ['Heavy-Gauge PET', 'Returnable Design', 'UV-Resistant', 'Loop Handle', 'BPA-Free'],
        inStock: true,
        weight: '300g',
        dimensions: 'Ø280mm x H500mm',
        color: 'Natural Blue Tint',
        tags: ['water', '10L', 'large', 'dispenser', 'industrial'],
    },
    {
        name: 'CustomPack 750ml (Custom)',
        capacity: '750ml',
        material: 'PET (Polyethylene Terephthalate)',
        image: '',
        description: 'Fully customizable 750ml bottle with unlimited shape and design options. Perfect for brand differentiation and premium product launches.',
        category: 'custom',
        features: ['Custom Mold', 'Any Shape', 'Logo Embossing', 'Color Options', 'No MOQ Limit on Samples'],
        inStock: true,
        weight: 'Varies',
        dimensions: 'Custom',
        color: 'Any Color Available',
        tags: ['custom', '750ml', 'branding', 'design'],
    },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create admin user
        const adminPassword = await bcrypt.hash('Admin@123', 12);
        await User.create({
            name: 'Admin User',
            email: 'admin@purepet.com',
            password: adminPassword,
            role: 'admin',
            phone: '+91 98765 43210',
            company: 'PurePet Solutions',
        });

        // Create test user
        const userPassword = await bcrypt.hash('User@123', 12);
        await User.create({
            name: 'Test User',
            email: 'user@purepet.com',
            password: userPassword,
            role: 'user',
            phone: '+91 91234 56789',
            company: 'Demo Corp',
        });

        // Insert products
        await Product.insertMany(products);

        console.log('✅ Seeded admin: admin@purepet.com / Admin@123');
        console.log('✅ Seeded user:  user@purepet.com / User@123');
        console.log(`✅ Seeded ${products.length} products`);
        console.log('🎉 Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
        process.exit(1);
    }
};

seedDB();
