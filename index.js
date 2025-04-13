require('dotenv').config()
const fs = require("fs")
const express = require("express")
const cookieparser = require("cookie-parser")
const path = require("path")
const {router} =require("./routes")
const blogRout =require("./routes/blog")
const {Connector} = require("./Database/index")
const CommentRouter = require("./routes/comment")
const cors = require("cors")
const port = process.env.port
const app = express()
app.use(cors())
app.use(cookieparser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/logopics')));
app.set("view engine","ejs");
app.set("views",path.resolve("./views"))

Connector(process.env.MONGODB_URL)

app.use("/", router)
app.use("/", blogRout)
app.use("/", CommentRouter)



app.listen(port, () => console.log(`surver is running at port:${port}`))
