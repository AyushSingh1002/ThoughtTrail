const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Username is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  salt: {
    type : String
  },
  Bio: {
    type: String,
    default : "",
  },
  lastName: {
    type : String,
    default : "",
  },
  ProfilePic: {
    type : String,
  default : "https://th.bing.com/th/id/OIP.5RYq7OxqpuRcYHUn66mQmQHaHa?w=201&h=201&c=7&r=0&o=5&dpr=1.1&pid=1.7",
  },
  followers: {
    type: [String],
    default: [],
  },
  following: {
    type: [String],
    default: [],
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

}
,
  {timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports = User;
