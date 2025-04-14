const userSchema = require('../Model/index.js');
const generateOTP = require('../lib/emailSender.js').generateOTP;
const sendOTPEmail = require('../lib/emailSender.js').sendOTPEmail;
const bcrypt = require('bcrypt');

 async function ResendOtp(email) {

    const user = await userSchema.findOne({email: email});
    

    if (!user) {
        throw new Error('User not found');
    }
    user.otp = undefined; // Clear the existing OTP
    user.otpExpiry = undefined; // Clear the existing expiry date

    try {
        const otp = generateOTP()
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = hashedOTP;
    user.otpExpiry = otpExpires;
     user.save();

    await sendOTPEmail(email, otp)

     return "OTP sent to email";
    } catch (error) {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling if needed
        
    }


}
module.exports = {
    ResendOtp
}