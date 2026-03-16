const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const message = {
            from: `${process.env.FROM_NAME || 'PurePet Solutions'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to: options.to,
            bcc: options.bcc, // useful for sending to multiple users privately
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Email could not be sent', error);
        return false;
    }
};

module.exports = sendEmail;
