const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let personSchema = Schema({
    pid: {
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    written:[{
        type: Schema.Types.ObjectId,
        ref: 'Movie'
    }],
    acted:[{
        type: Schema.Types.ObjectId,
        ref: 'Movie'
    }],
    directed:[{
        type: Schema.Types.ObjectId,
        ref: 'Movie'
    }],
    collaborators:[{
        type: Schema.Types.ObjectId,
        ref: 'Person'
    }],
    followers:[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

personSchema.statics.findAll = function(list, callback){
    this.find().where("name").in(list).exec(callback)
}

module.exports = mongoose.model("Person", personSchema);