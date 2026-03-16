const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js DNS to resolve IPv4 addresses before IPv6.
// Render completely drops unassigned IPv6 outbound connections, causing ENETUNREACH.
dns.setDefaultResultOrder('ipv4first');
const sendEmail = async (options) => {
    try {
        // Overriding the environment variable port to 465.
        // Render extensively blocks or drops STARTTLS (587) and 25 egress traffic.
        const port = 465; 
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: port,
            secure: true, // true enforces standard SMTPS over 465, which bypassing firewalls more cleanly
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS, // MUST be a 16-character Gmail App Password
            },
            tls: {
                // Do not fail on invalid certs (sometimes useful in strict environments)
                rejectUnauthorized: false
            },
            // Hard-enforce IPv4 DNS lookup bypassing Node's underlying socket defaults
            lookup: (hostname, options, callback) => {
                dns.lookup(hostname, { family: 4 }, (err, address, family) => {
                    callback(err, address, family);
                });
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
