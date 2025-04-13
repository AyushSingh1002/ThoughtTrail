const cloudinary = require("../lib/cloudinary.js");
const blogSchema = require("../Model/blog");
const fs = require("fs");

async function createBlog(req, res) {
    try {
      const { title, content, category } = req.body;
      const file = req.file; // File is in memory (buffer)
  
      let blogPic = "";
  
      if (file) {
        // Stream file buffer to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Use timestamp to avoid conflicts
            folder: 'blogCovers', // Optional: organize in Cloudinary
            secure: true, // Use HTTPS for secure URLs
          },
          (error, response) => {
            if (error) {
              console.error('Error uploading to Cloudinary:', error);
              throw error; // Let the catch block handle it
            }
            blogPic = response.secure_url;
          }
        );
  
        // Pipe the file buffer to Cloudinary
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
  
        // Wait for the upload to complete
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
      }
  
      // Create the blog in the database
      const blog = await blogSchema.create({
        title,
        content,
        category,
        CoverImgURL: blogPic, // Use new URL or empty string if no file
        createdby: req.user._id,
      });
  
      return res.status(201).redirect("/");
    } catch (error) {
      console.error("Error in createBlog:", error); // Log full error details
  
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