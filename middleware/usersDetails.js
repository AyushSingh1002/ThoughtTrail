const userSchema = require("../Model/index")
app.use((req, res, next) => {
    if (req.user) {
      userSchema.findById(req.user._id)
        .then((user) => {
          res.locals.user = user; // Fetch the latest data
          next();
        })
        .catch((err) => {
          console.error(err);
          next();
        });
    } else {
      res.locals.user = null;
      next();
    }
  });
  