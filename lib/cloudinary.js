// This file is used to configure the Cloudinary SDK
const cloudinary =  require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME , // Click 'View API Keys' above to copy your Cloud name
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;