const jwt = require("jsonwebtoken")
const secret = "AHADHGWYFWVSBVGSWD213435"

function createUserToken(user) {
    const payload = {
        _id : user._id,
        email : user.email,
        userName : user.userName,
        ProfilePic: user.ProfilePic
    }
    const token = jwt.sign(payload,secret ,{
        expiresIn: "3d"
    })
    return token
}

function validateUser(token) {
    const payload = jwt.verify(token, secret)
    return payload
}
module.exports= {createUserToken, validateUser}