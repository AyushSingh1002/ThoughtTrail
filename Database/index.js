const mongoose = require('mongoose');

async function Connector(url) {
    return mongoose.connect(url)
    .then(() => console.log("connected"))
    .catch(() => console.log("disconnected"))
}
module.exports = {Connector}