const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        capacity: {
            type: String,
            required: [true, 'Capacity is required'],
            trim: true,
        },
        material: {
            type: String,
            required: [true, 'Material is required'],
            trim: true,
            default: 'PET (Polyethylene Terephthalate)',
        },
        image: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        category: {
            type: String,
            enum: ['water', 'beverage', 'pharma', 'food', 'chemical', 'custom'],
            default: 'water',
        },
        features: [{ type: String }],
        inStock: { type: Boolean, default: true },
        countInStock: { type: Number, default: 0, min: 0 },
        weight: { type: String, default: '' },
        dimensions: { type: String, default: '' },
        color: { type: String, default: 'Clear / Transparent' },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
