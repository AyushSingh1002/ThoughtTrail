const express = require("express")
const {addComment, removeComment, showComment, editComment} = require("../controller/comment")
const checkUserAuth = require("../middleware/CookieChecker")
const CommentRouter = express.Router()

CommentRouter.post("/",checkUserAuth, addComment)
CommentRouter.delete("/:id",checkUserAuth, removeComment)

module.exports = CommentRouter