const mongoose = require('mongoose');

async function Connector(url) {
    return mongoose.connect(url)
    .then(() => console.log("connected"))
    .catch((err) => console.log("disconnected",err))
}
module.exports = {Connector}