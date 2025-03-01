const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Username is required'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'content is required'],

  },
  CoverImgURL: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: "Personal"
  }
}
,
  {timestamps: true});

const blog = mongoose.model('blog', blogSchema);
module.exports = blog;
