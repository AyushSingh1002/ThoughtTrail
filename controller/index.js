const userSchema = require("../Model/index")
const {createUserToken} = require("../Services/Auth")

async function createUser(req,res) {
    const body = req.body
    const {userName, email, password} = body
    try {
        const user = await userSchema.create({
            userName: body.userName,
            email: body.email,
            password: body.password
        })
        const token = createUserToken(user)
        return res.cookie("token", token).redirect("/")
    } catch (error) {
        console.log("error", error)
        return  res.render("signUp",{
            errors: "already exiting email or password",
        })
        }
    }


module.exports = {createUser}