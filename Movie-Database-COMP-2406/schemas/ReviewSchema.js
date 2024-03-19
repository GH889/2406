const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//TODO: Implement the review object as a mongoose schema

let reviewSchema = Schema({
    rid: {
        type: String,
        required: [true, "Review ID not supplied"]
    },
    uid: {
        type: String,
        required: [true, "User uid not supplied"]
    },
    username: {
        type: String,
        required: [true, "Username not supplied"]
    },
    mid: {
        type: String,
        required: [true, "Movie mid not supplied"]
    },
    movieTitle: {
        type: String,
        required: [true, "Movie title not supplied"]
    },
    score: {
        type: Number,
        required: [true, "Review score not supplied"]
    },
    type: {
        type: String,
        default: "basic",
        validate: [(rtype)=>{return rtype === "basic" || rtype === "full"}]
    },
    title: {
        type: String
    },
    body: {
        type: String
    }
});

module.exports = mongoose.model('Review', reviewSchema);