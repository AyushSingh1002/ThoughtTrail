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
const { flushCompileCache } = require("module")

const router = express.Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve("./public/profilePic"))
    },
    filename: function (req, file, cb) {
      const fileName = `${Date.now()}-${file.originalname}`
      cb(null, fileName)
    }
  })

  const upload = multer({storage})



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
      const response = await cloudinary.uploader.upload(file.path, {
        public_id: file.originalname.split('.')[0], // Optional
        secure: false, // Optional, set to true if you want to use HTTPS
      });
    
      profilePicUrl = response.secure_url;
      // Cleanup temporary file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }

    const updatedUser = await userSchema.findByIdAndUpdate(
      req.params.id,
      {
        userName: body.userName,
        email: body.email,
        Bio: body.Bio,
        lastName: body.lastName,
        ProfilePic: `${profilePicUrl}` || body.ProfilePic, // If new image uploaded, else keep old
      },
      { new: true } // Return the updated document
    );

    res.redirect(`/profile/${req.user._id}`);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", err); // Log full error details
  throw err; // Re-throw to allow your existing error handler to catch it
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
