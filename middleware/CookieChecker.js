const {validateUser} = require("../Services/Auth")
const userSchema = require("../Model/index")

async function checkUserAuth(req, res, next) {
  const userUid = req.cookies?.token
  

  if(!userUid) {
   return next()
  };
  

  const user = validateUser(userUid);
  

  if(!user) {
   return next()
  };
  
  const userInfo = await userSchema.findById(user._id)
   req.user = userInfo
  next()
}
module.exports = checkUserAuth