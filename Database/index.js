const mongoose = require('mongoose');

async function Connector(url) {
    return mongoose.connect(url, {
        useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
    })
    .then(() => console.log("connected"))
    .catch((err) => console.log("disconnected",err))
}
module.exports = {Connector}