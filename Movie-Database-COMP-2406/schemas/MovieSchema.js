const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//TODO: Implement the movie object as a mongoose schema

let movieSchema = Schema({
    mid:{
        type: String,
        required: [true, "Movie ID not supplied"]
    },
    midNum:{
        type: Number
    },
    title:{
        type: String,
        required: [true, "Movie title not supplied"]
    },
    rating:{
        type: String,
        default: "Not Rated"
    },
    year:{
        type: Number,
        required: [true, "Release year not supplied"],
        validate: [(ryear)=>{return ryear >= 0}, "Invalid release year."]
    },
    releaseDay:{
        type: Number,
        required: [true, "Release day not supplied"],
        validate: [(rDate)=>{return rDate > 0}, "Invalid release day."]
    },
    releaseMonth:{
        type: Number,
        required: [true, "Release month not supplied"],
        validate: [(rmonth)=>{return (rmonth > 0 && rmonth < 13)}, "Invalid release month."]
    },
    runtime:{
        type: Number,
        required: [true, "Runtime not supplied"],
        validate: [(rt)=>{return rt>0}, "Invalid runtime."]
    },
    genre:{
        type: [String],
        required: [true, "Genres not supplied"]
    },
    plot:{
        type: String,
        required: [true, "Plot not supplied"]
    },
    actors:{
        type: [{
            type: Schema.Types.ObjectId,
            ref:'Person'
        }],
        default: []
    },
    director:{
        type: [{
            type: Schema.Types.ObjectId,
            ref:'Person'
        }],
        default: []
    },
    writer:{
        type: [{
            type: Schema.Types.ObjectId,
            ref:'Person'
        }],
        default: []
    },
    poster:{
        type: String,
        required: [true, "Poster not supplied"]
    },
    reviews:{
        type: [{
            type: Schema.Types.ObjectId,
            ref:'Review'
        }],
        default: []
    },
    totalScore:{
        type: Number,
        default: 0
    }
});

movieSchema.statics.movieSearch = function(people, query, ratingSearch, callback){
    let startIndex = ((query.page - 1) * 10);
    this.find({
        $or: [
            {
                actors: {
                    $in: people
                }
            },
            {
                writer: {
                    $in: people
                }
            },
            {
                director: {
                    $in: people
                }
            }
        ]
    })
    .where("title").equals(new RegExp(".*" + query.title + ".*", "i"))
    .where("genre").equals(new RegExp(".*" + query.genre + ".*", "i"))
    .where("year").gte(query.year).lte(query.endYear)
    .where("rating").equals(ratingSearch)
    .limit(10)
    .skip(startIndex)
    .exec(callback);
}

movieSchema.statics.similar = function(baseMovie, callback){
    let yearSeed = [];
    yearSeed.push(decade(baseMovie.year));
    for(let i = 0; i < 9; i++){
        yearSeed.push(yearSeed[i] + 1);
    }
    this.find()
    .where("mid").ne(baseMovie.mid)
    .where("genre").in(baseMovie.genre)
    .where("rating").equals(baseMovie.rating)
    .where("year").in(yearSeed)
    .limit(5)
    .exec(callback);
}

function decade(year){
    return Math.floor(year / 10) * 10;
}

module.exports = mongoose.model('Movie', movieSchema);