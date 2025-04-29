const mongoose = require('mongoose');

new user = mongoose.Schema({
    owner: String,
    name: String,
    username: String,
    groups: [String],

});

module.exports = mongoose.model('User', user);