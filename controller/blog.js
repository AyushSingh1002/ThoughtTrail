const imagekitpk = require("../lib/imagekit");
const blogSchema = require("../Model/blog");
const fs = require("fs");

async function createBlog(req, res) {
    try {
      const { title, content, category } = req.body;
      const file = req.file; // Already in memory!
  
      let blogPic = "";
  
      if (file) {
        const base64String = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  
        const response = await imagekitpk.upload({
          file: base64String,
          fileName: file.originalname,
        });
  
        blogPic = response.url;
      }
  
      const blog = await blogSchema.create({
        title,
        content,
        category,
        CoverImgURL: blogPic,
        createdby: req.user._id,
      });
  
      return res.status(201).redirect("/");
    } catch (error) {
      console.error("Error creating blog:", error.message);
  
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
  
      return res.status(500).json({ error: "Server error" });
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