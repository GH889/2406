const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//TODO: Implement the notification object as a mongoose schema

let notifSchema = mongoose.Schema({
    nid: {
        type: String,
        required: [true, "Notification ID not supplied"]
    },
    subject: {
        type: String,
        required: [true, "Notification subject not supplied"]
    },
    subjectName: {
        type: String,
        required: [true, "Notification subject name not supplied"]
    },
    link:{
        type: String,
        required: [true, "Notification link not supplied"]
    }
});

module.exports = mongoose.model('Notification', notifSchema);