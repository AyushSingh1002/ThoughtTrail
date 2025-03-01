const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type : String,
    required : true
  },
  creater: {
    type: String,
    required: true
  },
  onPost:{
    type: String
  }
}
,
  {timestamps: true});

const comment = mongoose.model('comment', commentSchema);
module.exports = comment;
