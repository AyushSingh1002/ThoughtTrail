const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
}

// Create a transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com', 
  port: 587,              
  secure: false,
  auth: {
    user: process.env.FROM_EMAIL, // Set this in your environment variables
    pass: process.env.FROM_PASS, // Use App Password if 2FA is enabled
  },
});

// Function to send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.FROM_EMAIL , // Verified sender
    to: email,
    subject: 'Your Verification Code from [ThoughtTrail]', // Professional subject
  text: `Hello,

Here is your verification code: ${otp}

Please enter this code on the website to complete your verification. If you did not request this code, you can safely ignore this email.

Thank you,
[Your App Name] Team`, // Simplified text body
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Your Verification Code</h2>
      <p>Hello,</p>
      <p>Here is your verification code:</p>
      <h3 style="color: #2c7be5;">${otp}</h3>
      <p>Please enter this code on the website to complete your verification.</p>
      <p>If you did not request this code, you can safely ignore this email.</p>
      <hr>
      <p style="font-size: 0.9em;">This email was sent by [ThoughtTrail].</p>
    </div>
  `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow error for caller to handle if necessary
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
};
