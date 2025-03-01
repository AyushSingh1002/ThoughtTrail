const {validateUser} = require("../Services/Auth")

async function checkUserAuth(req, res, next) {
  const userUid = req.cookies?.token
  

  if(!userUid) {
   return next()
  };
  

  const user = validateUser(userUid);
  

  if(!user) {
   return next()
  };
  

  req.user = user;

  next()
}
module.exports = checkUserAuth