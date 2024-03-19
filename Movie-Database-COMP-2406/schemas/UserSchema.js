const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//TODO: Implement the user object as a mongoose schema

let userSchema = Schema({
    uid:{
        type: String,
        required: [true, "User ID not supplied"]
    },
    username:{
        type: String,
        required: [true, "Username not supplied"],
        maxlength: 50
    },
    password:{
        type: String,
        reqired: [true, "Password not supplied"]
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref:'Review'
    }],
    followedPeople: [{
        type: Schema.Types.ObjectId,
        ref:'Person'
    }],
    followedUsers: [{
        type: Schema.Types.ObjectId,
        ref:'User'
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref:'User'
    }],
    watchList: [{
        type: Schema.Types.ObjectId,
        ref:'Movie'
    }],
    userType: {
        type: String,
        required: [true, "User type not supplied"]
    },
    notifications: [{
        type: Schema.Types.ObjectId,
        ref:'Notification'
    }]
});

module.exports = mongoose.model("User", userSchema);