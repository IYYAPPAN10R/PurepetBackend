const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        phone: { type: String, trim: true, default: '' },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['unread', 'read', 'replied'],
            default: 'unread',
        },
        aiResponse: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
