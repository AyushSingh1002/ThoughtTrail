require('dotenv').config();
const fs = require("fs");
const express = require("express");
const cookieparser = require("cookie-parser");
const path = require("path");
const { router } = require("./routes");
const blogRout = require("./routes/blog");
const { Connector } = require("./Database/index");
const CommentRouter = require("./routes/comment");
const cors = require("cors");

const app = express();
const port = process.env.port; // Fallback to port 3000 if env variable is missing

// Middleware
app.use(cors({ origin: '*' }))
app.use(cookieparser()); // Parse cookies
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Database connection
Connector(process.env.MONGODB_URL);


// Routes
app.use("/", router);
app.use("/", blogRout);
app.use("/", CommentRouter);

app.get('/loaderio-45035bbc59e5eef716c5b5068298ae29.txt', (req, res) => {
  res.type('text/plain'); // Set proper content type
  res.send('loaderio-45035bbc59e5eef716c5b5068298ae29');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});
