const checkUserAuth = require("../middleware/CookieChecker")
const multer = require("multer")
const path = require("path")
const { createUser, findUser, followUsers } = require("../controller")
const blogSchema = require("../Model/blog")
const express = require("express")
const userSchema = require("../Model/index")
const imagekitpk = require("../lib/imagekit")
const {createUserToken} = require("../Services/Auth")
const fs = require("fs")
const { console } = require("inspector")

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
    const {email, password} = body
    try {
        const user = await userSchema.findOne({email, password})
        if(!user){
            return  res.render({error : "password or email is wrong"})
        }
        const token = createUserToken(user)
        return res.cookie("token", token).redirect("/")
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
      const fileBuffer = fs.readFileSync(file.path);
      const response = await imagekitpk.upload({
        file: fileBuffer.toString("base64"),
        fileName: file.originalname,
      });
      profilePicUrl = response.url;
      fs.unlinkSync(file.path);
    }

    const updatedUser = await userSchema.findByIdAndUpdate(
      req.params.id,
      {
        userName: body.userName,
        email: body.email,
        Bio: body.Bio,
        lastName: body.lastName,
        ProfilePic: profilePicUrl || body.ProfilePic,
      },
      { new: true }
    );

    res.redirect(`/profile/${req.user._id}`);
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});
router.get("/follow/:id", checkUserAuth, async (req, res) => {
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

      // Render the user page with the fetched user details
      return res.render("userPage", {
          curUser: currentUser,
          user: req.user,
      });
  } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).send("Internal Server Error");
  }
});
router.post("/follow/:id", checkUserAuth, followUsers)


module.exports = {router}
