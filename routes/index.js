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
const { console } = require("inspector")
const streamifier = require('streamifier');
const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() });



router.get("/signup", (req,res) => res.render("signUp"))
router.post("/signup", createUser)
router.get("/login", (req,res) => res.render("log"))
router.post("/login", async (req,res)=>{
    const body = req.body
    const email = body.username;
    const {password} = body
    console.log(email, password)
    try {
        const user = await userSchema.findOne({email, password})
        if(!user){
            return  res.render({error : "password or email is wrong"})
        }
        const token = createUserToken(user)
        return res.cookie("token", token, {
          httpOnly: true,      
          sameSite: "Strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, 
        }).redirect("/")
    } catch (error) {
        return  res.render("signUp",{
            errors: "incorrect email or password"
        })
    }
})

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
      // Stream file buffer to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Use timestamp to avoid conflicts
          folder: 'profilePics', // Optional: organize in Cloudinary
          secure: true, // Use HTTPS for secure URLs
        },
        (error, response) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error; // Let the catch block handle it
          }
          profilePicUrl = response.secure_url;
        }
      );

      // Pipe the file buffer to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);

      // Wait for the upload to complete (since upload_stream is async)
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
    }

    // Update user in the database
    const updatedUser = await userSchema.findByIdAndUpdate(
      req.params.id,
      {
        userName: body.userName,
        email: body.email,
        Bio: body.Bio,
        lastName: body.lastName,
        ProfilePic: profilePicUrl || body.ProfilePic, // Use new URL or keep existing
      },
      { new: true } // Return the updated document
    );

    console.log("Updated user:", updatedUser); // Log updated user

    res.redirect(`/profile/${req.user._id}`);
  } catch (error) {
    console.error("Error in profile update:", error); // Log full error details
    // Optionally render an error page or redirect with a message
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


module.exports = {router}
