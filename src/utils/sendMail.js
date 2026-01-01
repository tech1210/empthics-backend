import nodemailer from 'nodemailer';

const EMAIL_USERNAME = process.env.EMAIL_USERNAME || 'empthics@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'dihc urwc pnei povm';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Empthics <empthics@gmail.com>';

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
});

/**
 * Generic send mail function
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - html content
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const message = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(message);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};
