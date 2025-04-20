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
    const userId = req.user._id; // Assuming user information is available in `req.user`

    try {
        // Fetch the current blog
        const curBlog = await blogSchema.findById(blogId);

        if (!curBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Check if userId exists (should be a valid user, this is usually handled by authentication middleware)
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Initialize likes array if not already initialized
        if (!curBlog.likes) {
            curBlog.likes = []; // Initialize likes as an empty array if null or undefined
        }

        // Toggle the like status
        if (curBlog.likes.includes(userId)) {
            curBlog.likes.pull(userId); // Remove userId if already liked
        } else {
            curBlog.likes.push(userId); // Add userId if not liked
        }

        // Save the updated blog
        await curBlog.save();

        // Return a success response
        return res.status(200).json({ 
            message: "Reaction updated successfully", 
            likesCount: curBlog.likes.length, // Return the updated like count
            liked: curBlog.likes.includes(userId) // Return the current liked status for the user
        });

    } catch (error) {
        console.error("Error reacting to blog:", error.message);

        // Handle specific validation errors or other errors
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }

        // Catch all other errors
        return res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = { createBlog, reactOnBlog };