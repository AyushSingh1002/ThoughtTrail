const cloudinary = require("../lib/cloudinary.js");
const blogSchema = require("../Model/blog");
const fs = require("fs");

async function createBlog(req, res) {
    try {
      const { title, content, category } = req.body;
      const file = req.file;
  
      let blogPic = "";
  
      if (file) {
        // Convert buffer to base64 for Cloudinary upload
        const base64String = file.buffer.toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64String}`;
  
        // Upload directly to Cloudinary
        const response = await cloudinary.uploader.upload(dataUri, {
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          secure: false,
        });
  
        blogPic = response.secure_url;
      }
  
      // Create the blog in the database
      const blog = await blogSchema.create({
        title,
        content,
        category,
        CoverImgURL: `${blogPic}`,
        createdby: req.user._id,
      });
  
      return res.status(201).redirect("/");
    } catch (error) {
      console.error("Error in createBlog:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Server error", details: error.message });
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