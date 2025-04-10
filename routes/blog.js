const multer = require("multer")
const {createBlog, findBlog} = require("../controller/blog")
const checkUserAuth = require("../middleware/CookieChecker")
const express = require("express")
const blogSchema= require("../Model/blog")
const path = require("path")
const router = express.Router()
const Comment = require("../Model/comments")
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve("./public/uploads/"))
    },
    filename: function (req, file, cb) {
      const fileName = `${Date.now()}-${file.originalname}`
      cb(null, fileName)
    }
  })
  
  const upload = multer({storage})

router.get("/blog",checkUserAuth, (req,res) => res.render("addblogs",{
  user: req.user
}))
router.post("/blog",upload.single('coverImg'), createBlog)

router.get("/blog/:id",checkUserAuth,async(req,res)=>{
  const blog = await blogSchema.findById(req.params.id).populate("createdby")
  const comment = await Comment.find({onPost: req.params.id}).populate('creater')
    return res.render("blog",{
      blogid : blog,
      user: req.user,
      comment: comment,
    })
}
)
module.exports = router
