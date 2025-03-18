const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type : String,
    required : true
  },
  creater: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  onPost:{
    type: String
  }
}
,
  {timestamps: true});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
