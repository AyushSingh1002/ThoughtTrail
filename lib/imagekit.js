const imagekit = require("imagekit")

const imagekitpk = new imagekit({
    publicKey: "public_ioC0Q22DX//jNlzPZP8NqclGxnI=",       
    privateKey: "private_Ay8BNb+qmhJ8/UuugXBkmCscSqI=",     
    urlEndpoint: "https://ik.imagekit.io/7njuwsjch", 
});

module.exports = imagekitpk
