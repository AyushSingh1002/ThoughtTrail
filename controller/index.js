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
        return res.cookie("token", token, {
            httpOnly: true,      
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
          }).redirect("/")
    } catch (error) {
        console.log("error", error)
        return  res.render("signUp",{
            errors: "already exiting email or password",
        })
        }
    }
    async function followUsers(req, res){
        const userId = req.params.id;
        const currentUserId = req.user._id;
        try {

            const user = await userSchema.findById(userId);
            const currentUser = await userSchema.findById(currentUserId);

            if (!user || !currentUser) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.followers.includes(currentUserId)) {
                // User is already followed, unfollow them
                user.followers.pull(currentUserId);
                currentUser.following.pull(userId);
            } else {
                // User is not followed, follow them
                user.followers.push(currentUserId);
                currentUser.following.push(userId);
            }

            await user.save();
            await currentUser.save();

            return res.status(200).redirect("back");
            
        } catch (error) {
            console.log("error", error)
            return res.status(500).json({ message: "Internal Server Error" });
            
        }
     }


module.exports = {createUser, followUsers}