const userSchema = require("../Model/index")
const sendOTPEmail = require("../lib/emailSender.js").sendOTPEmail
const generateOTP = require("../lib/emailSender.js").generateOTP
const bcrypt = require("bcrypt")
async function createUser(req, res) {
    // Extract and validate request body
    const { userName, email, password } = req.body || {};
  
    // Basic input validation
    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields (userName, email, or password)' });
    }
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Prepare temporary user data
      const tempUserData = {
        userName,
        email,
        hashedPassword,
      };

      res.cookie("tokenV" , JSON.stringify({userEmail : email}), {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
      })
  
      // Set temporary cookie with user data (expires in 5 minutes)
      res.cookie('tempUserData', JSON.stringify(tempUserData), {
        httpOnly: true,
        sameSite: 'lax', // Prevent CSRF attacks
        maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
      });
  
      // Generate and send OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry
  
      // Store OTP in a temporary cookie (instead of database)
      res.cookie('tempOTP', JSON.stringify({ otp: hashedOTP, expires: otpExpires }), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000,
      });
  
  
      // Send OTP via email asynchronously
      sendOTPEmail(email, otp).catch((emailError) => {
        console.error('Failed to send OTP email:', emailError);
        // Optionally log but don't fail the request
      });
  
      // Render verification page
      return res.render('verifyOtp', { email });
    } catch (error) {
      console.error('User creation setup error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
    async function followUsers(req, res){
        const userId = req.params.id;
        const currentUserId = req.user._id;
        try {

            const user = await userSchema.findById(userId);
            const currentUser = await userSchema.findById(currentUserId);

            if (!user || !currentUser) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.followers.includes(currentUserId)) {
                // User is already followed, unfollow them
                user.followers.pull(currentUserId);
                currentUser.following.pull(userId);
            } else {
                // User is not followed, follow them
                user.followers.push(currentUserId);
                currentUser.following.push(userId);
            }

            await user.save();
            await currentUser.save();

            return res.status(200).redirect("back");
            
        } catch (error) {
            console.log("error", error)
            return res.status(500).json({ message: "Internal Server Error" });
            
        }
     }


module.exports = {createUser, followUsers}