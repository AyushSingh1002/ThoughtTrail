const blogSchema = require("../Model/blog");

async function createBlog(req, res) {
    try {
        const { title, content, category} = req.body;
        
        // Create a new blog entry
        const blog = await blogSchema.create({
            title,
            content,
            category,
            CoverImgURL : (`/uploads/${req.file.filename}`)
        });
        return res.status(201).redirect(`/`);
    } catch (error) {
        console.error("Error creating blog:", error.message);

        // Handle specific validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = { createBlog };
