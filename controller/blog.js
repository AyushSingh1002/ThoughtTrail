const cloudinary = require("../lib/cloudinary.js");
const blogSchema = require("../Model/blog");
const fs = require("fs");

async function createBlog(req, res) {
    try {
      const { title, content, category } = req.body;
      const file = req.file; // Already in memory!
  
      let blogPic = "";
  
      if (file) {
        const response = await cloudinary.uploader.upload(file.path, {
          public_id: file.originalname.split(".")[0],
            secure:false, // Optional, set to true if you want to use HTTPS
        });
            
              blogPic = response.secure_url;
            
              // Cleanup temporary file
              fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting temporary file:', err);
              });
      }
  
      const blog = await blogSchema.create({
        title,
        content,
        category,
        CoverImgURL: `${blogPic}`,
        createdby: req.user._id,
      });
  
      return res.status(201).redirect("/");
    } catch (error) {
      console.error("Error creating blog:", error.message);
  
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
  
      return res.status(500).json({ error: "Server error", error });
    }
  }
  
async function reactOnBlog(req, res) {
    const blogId = req.params.id;
    const userId = req.user._id;

   try {
    const curBlog = await blogSchema.findById(blogId)
    
    if(!curBlog || !userId) {
        return res.status(400).json({ message: "Blog ID and User ID are required" });
    }
    
    if (curBlog.likes === null) {
        curBlog.likes = []; // Initialize likes if it doesn't exist
    }
    if (curBlog.likes.includes(userId)) {
        curBlog.likes.pull(userId);
    } else {
        curBlog.likes.push(userId);
    }
    await curBlog.save();
    return res.status(200).redirect(`/blog/${blogId}`);
   } catch (error) {
        console.error("Error reacting to blog:", error.message);

        // Handle specific validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
    }
   }

module.exports = { createBlog, reactOnBlog };