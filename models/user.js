const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: false
    },
    avatarUrl: {
        type: String,
        required: false
    }
});

module.exports= mongoose.model('User', UserSchema);