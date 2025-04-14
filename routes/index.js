const checkUserAuth = require("../middleware/CookieChecker")
const multer = require("multer")
const path = require("path")
const { createUser, findUser, followUsers } = require("../controller")
const blogSchema = require("../Model/blog")
const express = require("express")
const userSchema = require("../Model/index")
const cloudinary = require("../lib/cloudinary.js")
const {createUserToken} = require("../Services/Auth")
const fs = require("fs")
const bcrypt = require("bcrypt")
const {generateOTP, sendOTPEmail} = require("../lib/emailSender.js")
const { ResendOtp } = require("../Services/verifyOtp.js")

const router = express.Router()



  const upload = multer({storage : multer.memoryStorage()})



router.get("/signup", (req,res) => res.render("signUp"))
router.post("/signup", createUser)
router.get("/login", (req,res) => res.render("log"))
router.post('/login', async (req, res) => {
  // Extract and validate request body
  const { username: email, password } = req.body || {};

  // Basic input validation
  if (!email || !password) {
    return res.render('log', { errors: 'Please provide both email and password' });
  }

  try {
    // Find user by email
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.render('log', { errors: 'Invalid credentials' });
    }


    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('log', { errors: 'Invalid credentials' });
    }

    const token = createUserToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    }).redirect("/");
  } catch (error) {
    console.error('Login error:', error);
    return res.render('log', { errors: 'An error occurred during login' });
  }
});

router.get("/",checkUserAuth,async(req,res)=>{
    const blog = await blogSchema.find({})
    return res.render("home",{
        user: req.user,
        blogs: blog,
    })

})
router.get("/a",checkUserAuth,async(req,res)=>{
  const id = req.user._id
  const data = await userSchema.findById(id);
  return res.render("navbar", {
    userInfo : data
  })
})


router.get("/logout",(req,res)=> {
    res.clearCookie("token").redirect("/")
})
router.get("/profile/:id",checkUserAuth,async(req,res)=> {
    const id = req.user._id;
    const userInfo = await userSchema.findById(id)
    return res.render("profile",{
        user: req.user,
        userInfo: userInfo,
    })
})

router.post("/profile/:id", checkUserAuth, upload.single("file-input"), async (req, res) => {
  try {
    const file = req.file;
    const body = req.body;

    let profilePicUrl = "";

    if (file) {
      // Convert buffer to base64 for Cloudinary upload
      const base64String = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64String}`;

      // Upload directly to Cloudinary
      const response = await cloudinary.uploader.upload(dataUri, {
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        secure: false,
      });

      profilePicUrl = response.secure_url;
    }

    // Update user in the database
    const updatedUser = await userSchema.findByIdAndUpdate(
      req.params.id,
      {
        userName: body.userName,
        email: body.email,
        Bio: body.Bio,
        lastName: body.lastName,
        ProfilePic: `${profilePicUrl}` || body.ProfilePic,
      },
      { new: true }
    );

    console.log("Updated user:", updatedUser);
    res.redirect(`/profile/${req.user._id}`);
  } catch (error) {
    console.error("Error in profile update:", error);
    res.status(500).send("Error updating profile");
  }
});

router.get("/follow/:id", checkUserAuth, async (req, res) => {
  console.log("Route hit");
  try {
      const userId = req.params.id; // Directly extract the ID from params
      
      if (!userId) {
          return res.status(400).res.redirect("/login");
      }
      
      // Fetch user details using the ID
      const currentUser = await userSchema.findById(userId);
      console.log(currentUser);

      if (!currentUser) {
          return res.status(404).send("User not found");
      }

      //users blogs
      const userBlogs = await blogSchema.find({"createdby" : userId});
      console.log("userblogs", userBlogs)

      // Render the user page with the fetched user details
      return res.render("userPage", {
          curUser: currentUser,
          user: req.user,
          userBlogs: userBlogs,
      });
  } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).send("Internal Server Error");
  }
});
router.get("/settings", checkUserAuth, async (req, res) => {
  console.log("settings")
  const id = req.user._id;
  const data = await userSchema.findById(id);
  return res.render("settings", {
    userInfo: data,
    user: req.user,
  });
});
router.post("/settings", checkUserAuth, async (req, res) => {
  const id = req.user._id;
  const { password } = req.body;
  console.log("settings", req.body)
  const data = await userSchema.findByIdAndUpdate(id, {
    password: password,
  });
  res.redirect("/login");
});
router.post("/follow/:id", checkUserAuth, followUsers)

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tempUserData = JSON.parse(req.cookies.tempUserData || '{}');
    const tempOTPData = JSON.parse(req.cookies.tempOTP || '{}');

    // Validate temporary data
    if (!tempUserData.email || !tempOTPData.otp || !tempOTPData.expires) {
      return res.status(400).json({ error: 'Invalid or missing verification data' });
    }

    // Check if OTP is expired
    if (new Date(tempOTPData.expires) < Date.now()) {
      return res.status(400).render('verifyOtp', { error: 'OTP expired', email: tempUserData.email });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, tempOTPData.otp);
    if (!isMatch) {
      return res.status(400).render('verifyOtp', { error: 'Invalid OTP', email: tempUserData.email });
    }

    // Create user in database only after OTP verification
    const user = await userSchema.create({
      userName: tempUserData.userName,
      email: tempUserData.email,
      password: tempUserData.hashedPassword,
    });

    // Clear temporary cookies
    res.clearCookie('tempUserData');
    res.clearCookie('tempOTP');

    // Set session cookie (e.g., 24 hours or with "Remember Me")
    const rememberMe = req.body.rememberMe === 'on';
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 24 hours
    const token = createUserToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge,
    });


    return res.redirect('/'); // Redirect to home page after successful signup
  } catch (error) {
    console.error('OTP verification error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get("/resend-otp", async (req, res) => {
  try {
    const tokenV = req.cookies.tokenV; // Get tokenV cookie
    if (!tokenV) {
      return res.status(400).render('verifyOtp', { error: 'Email not found' });
    }

    const { userEmail } = JSON.parse(tokenV); // Parse the cookie to get email
    if (!userEmail) {
      return res.status(400).render('verifyOtp', { error: 'Invalid email data' });
    }

    // Call the ResendOtp function
    await ResendOtp(userEmail); // Assuming ResendOtp is an async function
    console.log("OTP resent to:", userEmail);
    // Success response
    res.render('verifyOtp', { email: userEmail, success: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).render('verifyOtp', { error: 'Server error', email: req.body?.email || '' });
  }
});


module.exports = {router}
