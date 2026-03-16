const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../utils/sendEmail');

// AI-based auto response generator
const generateAutoResponse = (subject, message) => {
    const lowerMsg = (subject + ' ' + message).toLowerCase();

    if (lowerMsg.includes('price') || lowerMsg.includes('quote') || lowerMsg.includes('cost')) {
        return 'Thank you for your inquiry about pricing! Our sales team will contact you within 24 hours with a detailed quote tailored to your requirements. For immediate assistance, you can reach us at +91 98765 43210.';
    } else if (lowerMsg.includes('sample') || lowerMsg.includes('trial')) {
        return "Thank you for your interest in our products! We'd be happy to provide samples. Our team will get in touch with you shortly to arrange sample delivery and discuss your specific requirements.";
    } else if (lowerMsg.includes('bulk') || lowerMsg.includes('wholesale') || lowerMsg.includes('order')) {
        return 'Thank you for your bulk order inquiry! PurePet Solutions specializes in high-volume manufacturing. Our enterprise team will reach out within 12 hours to discuss quantities, customization options, and competitive pricing.';
    } else if (lowerMsg.includes('custom') || lowerMsg.includes('design') || lowerMsg.includes('mold')) {
        return 'Thank you for reaching out about custom designs! We offer full custom mold development services. Our design engineers will review your requirements and contact you within 24 hours to discuss possibilities.';
    } else if (lowerMsg.includes('sustainability') || lowerMsg.includes('eco') || lowerMsg.includes('recycle')) {
        return "Thank you for your interest in our sustainability initiatives! We're committed to eco-friendly manufacturing. Our sustainability team will be happy to share our detailed practices and certifications with you.";
    } else {
        return "Thank you for contacting PurePet Solutions! We've received your message and our team will review it carefully. We strive to respond to all inquiries within 24 business hours. We look forward to serving you!";
    }
};

// @desc   Submit a contact message
// @route  POST /api/contact
// @access Public
exports.submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const aiResponse = generateAutoResponse(subject, message);
        const contactMsg = await ContactMessage.create({ name, email, phone, subject, message, aiResponse });

        // Asynchronously send emails (does not block API response)
        const sendNotifications = async () => {
            try {
                // 1. Send Email to Admin
                const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
                if (adminEmail) {
                    const adminHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                            <h2 style="color: #4CAF50;">New Contact Form Submission</h2>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <hr />
                            <p><strong>Message:</strong></p>
                            <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
                            <hr />
                            <p><strong>AI Auto-Response Sent:</strong></p>
                            <p style="color: #555;">${aiResponse}</p>
                        </div>
                    `;
                    await sendEmail({
                        to: adminEmail,
                        subject: `New Contact Form Submission: ${subject}`,
                        html: adminHtml,
                    });
                }

                // 2. Optionally Send Confirmation to User
                const userHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                        <h2 style="color: #4CAF50;">Thank You for Contacting Us!</h2>
                        <p>Hi ${name},</p>
                        <p>${aiResponse}</p>
                        <hr />
                        <h3>Your Submitted Details:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
                        <br />
                        <p>Best Regards,</p>
                        <p><strong>PurePet Solutions Team</strong></p>
                    </div>
                `;
                await sendEmail({
                    to: email,
                    subject: 'Message Received - PurePet Solutions',
                    html: userHtml,
                });
            } catch (error) {
                console.error('Failed to send contact emails:', error);
            }
        };

        // Fire and forget email sending
        sendNotifications();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you shortly.',
            aiResponse,
            contactMessage: contactMsg,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Get all contact messages (Admin)
// @route  GET /api/contact
// @access Private/Admin
exports.getMessages = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status && status !== 'all' ? { status } : {};
        const messages = await ContactMessage.find(query).sort('-createdAt');
        res.status(200).json({ success: true, count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Update message status (Admin)
// @route  PUT /api/contact/:id
// @access Private/Admin
exports.updateMessageStatus = async (req, res) => {
    try {
        const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
        res.status(200).json({ success: true, message: 'Status updated.', contactMessage: msg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Delete a message (Admin)
// @route  DELETE /api/contact/:id
// @access Private/Admin
exports.deleteMessage = async (req, res) => {
    try {
        const msg = await ContactMessage.findByIdAndDelete(req.params.id);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
        res.status(200).json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
