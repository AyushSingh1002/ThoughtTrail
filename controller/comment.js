const Comment = require("../Model/comments")

const addComment = async(req,res) => {
    try {
        const { content, post } = req.body
        const user = req.user._id
        if(!content || !post){
            console.log(post, content)
           return res.status(404).json({message: "404 post or comment not found1"})
        }
        const newComment = await Comment.create({
            content,
            onPost: post,
            creater: user,
        })
        res.status(200).redirect(`/blog/${post}`)
    } catch (error) {
        console.log("something went wrong in addComment",error)
    }
}
const removeComment = async (req,res) => {
    try {
       const commentId = req.params.id;
        const userComment = await Comment.findByIdAndDelete(commentId);
        if (!commentId) {
           return res.status(404).json({message: "comment not found"})
        }
        res.status(200).json({message: "comment deleted succesfully"})
    } catch (error) {
        console.log("something went wrong in removeComment")
    }
}
 
module.exports = {addComment, removeComment}