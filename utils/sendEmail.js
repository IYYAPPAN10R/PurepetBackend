const { Resend } = require('resend');

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend API
 * @param {Object} options - Email options (to, subject, html)
 */
const sendEmail = async (options) => {
    try {
        const fromName = process.env.FROM_NAME || 'PurePet Solutions';
        // Note: Resend requires a verified domain or uses onboarding@resend.dev for testing
        // Once you verify your domain, you can change this to your custom email.
        const fromEmail = 'onboarding@resend.dev'; 

        const { data, error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return false;
        }

        console.log('Email sent successfully via Resend:', data.id);
        return true;
    } catch (error) {
        console.error('Unexpected error sending email:', error);
        return false;
    }
};

module.exports = sendEmail;
