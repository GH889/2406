const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../schemas/MovieSchema');
const Person = require('../schemas/PersonSchema');
const Review = require('../schemas/ReviewSchema');
const User = require('../schemas/UserSchema');
const Notification = require('../schemas/NotifSchema');
let router = express.Router();

router.get("/addForm",verifyLogin, verifyContributingUser, sendMovieForm);
router.get("/", isLoggedIn, parseCriteria, getMovies, sendMultipleMovies);
router.get("/:id", isLoggedIn, resetReviewsLoaded, getMovie, inWatchList, sendSingleMovie);
router.get("/:id/reviews", getMovie, getMovieReviews, sendReviews);
router.get("/:id/recommendations", getMovie, getMovieRecommendations, sendRecommendations);
router.get("/:id/score", getMovie, getAvgScore, sendAvgScore);

router.post("/", verifyLogin, verifyContributingUser, verifyUnique, createMovie, checkActors, checkDirectors, checkWritters, saveMovie, movieNotification, reCalFreqCollab);
router.post("/:id/reviews", verifyLogin, getMovie, createReview, reviewNotification);

function sendMovieForm(req,res,next){
    if(req.user){req.loggedIn=true;}else{req.loggedIn=false;}
    res.render('addMovie',{loggedIn:req.loggedIn,uid:req.user.uid});
}

function parseCriteria(req, res, next){
    //Code taken from Mongoose store server example code, queryParser function
    let params = [];
    for(prop in req.query){
        if(prop == "page"){
            continue;
        }
        params.push(`${prop}=${req.query[prop]}`);
    }
    req.qstring = params.join("&");

    //End of outsourced code

    if(!req.query.title){
        req.query.title = "";
    }
    if(!req.query.genre){
        req.query.genre = "";
    }
    if(!req.query.person){
        req.query.person = "";
    }
    if(!req.query.rating){
        req.query.rating = "";
    }
    try{
        req.query.page = Number(req.query.page);
        if(isNaN(req.query.page) || req.query.page <= 0){
            console.log("YEET");
            throw "Bad Request";
        }
    }
    catch{
        res.status(401).send("Bad Search Request");
        return;
    }
    req.query.year = Number(req.query.year);
    if(isNaN(req.query.year)){
        req.query.year = 0;
        req.query.endYear = 3000;
    }
    else{
        req.query.endYear = req.query.year + 9;
    }
    next();
}

function getMovies(req, res, next){
    let ratingSearch;
    if(!req.query.rating){
        ratingSearch = new RegExp(".*" + req.query.rating + ".*", "i")
    }
    else{
        ratingSearch = req.query.rating;
    }
    Person.find()
    .where("name").equals(new RegExp(".*" + req.query.person + ".*", "i"))
    .exec(function(err, people){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!people){
            res.status(404).send("Could not find anyone with that name.");
        }
        Movie.movieSearch(people, req.query, ratingSearch, function(err, results){
            if(err) {
                console.log(err);
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            if(!results){
                res.status(404).send("Movies Not Found");
                return;
            }
            req.movies = results;
            next();
        });
    });
}

function sendMultipleMovies(req, res, next){
    res.format({
        "application/json": ()=>{},
        "text/html": ()=>{
            res.render("search", {movies: req.movies, qstring: req.qstring, page: req.query.page, loggedIn: req.loggedIn, uid: req.session.uid});
        }
    });
}

function isLoggedIn(req, res, next){
    if(!req.session.hasOwnProperty('uid')){
        req.loggedIn = false;
        next();
        return;
    }
    if(req.cookies.userid !== req.session.uid){
        req.loggedIn = false;
        next();
        return;
    }
    req.loggedIn = true;
    next();
}

function inWatchList(req, res, next){
    if(req.loggedIn){
        User.findOne({uid: req.session.uid}).exec(function(err,user){
            if(err) {
                console.log(err);
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            if(!user){
                res.status(401).send("INVALID USER");
                return;
            }
            req.inWatchList = user.watchList.includes(req.movie._id);
            next();
        });
    }
    else{
        req.inWatchList = false;
        next();
    }
}

function resetReviewsLoaded(req, res, next){
    req.session.reviewsLoaded = 0;
    next();
}
function getMovie(req, res, next){
    let mid = req.params.id;
    Movie.findOne({mid: mid}).populate("actors director writer").exec(function(err, result){
        if(err) {
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!result){
            res.status(404).send("COULD NOT FIND THAT MOVIE");
            return;
        }
        req.movie = result;
        next();
    });
}

function sendSingleMovie(req, res, next){
    res.format({
        "application/json": function(){
            res.status(200).json(req.movie);
        },
        "text/html": ()=> {res.render("movie", {movie: req.movie, loggedIn: req.loggedIn, inWatchList:req.inWatchList, uid: req.session.uid});}
    });
}

function getMovieReviews(req, res, next){
    Movie.findOne({mid: req.movie.mid}, {reviews:1}).populate("reviews").exec(function(err, result){
        if(err) {
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        res.reviews = result.reviews.slice(0, req.session.reviewsLoaded + 5);
        req.session.reviewsLoaded += 5;
        console.log(req.session.reviewsLoaded);
        next();
    });
}

function sendReviews(req, res, next){
    res.status(200).send(JSON.stringify(res.reviews));
}

function getMovieRecommendations(req, res, next){
    Movie.similar(req.movie, function(err, recommendations){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        res.recommended = recommendations;
        next();
    });
}

function sendRecommendations(req, res, next){
    res.status(200).send(JSON.stringify(res.recommended));
}

function getAvgScore(req, res, next){
    if(req.movie.reviews.length === 0){
        req.avgScore = 0;
    }
    else{
        req.avgScore = req.movie.totalScore / req.movie.reviews.length;
    }
    next();
}

function sendAvgScore(req, res, next){
    res.format({
        "application/json": ()=>{res.status(200).send({score: req.avgScore});}
    });
}

function createReview(req, res, next){
    if(req.body.score <= 0 || req.body.score > 10){
        res.status(401).send("ERROR: Invalid review score.");
        return;
    }
    let rid = makeReviewId(req.session.uid, req.movie.mid, req.app.locals.config.reviewIdNum);
    let newReview = new Review({
        rid: rid,
        uid: req.user.uid,
        username: req.user.username,
        mid: req.movie.mid,
        movieTitle: req.movie.title,
        score: req.body.score,
        type: req.body.type,
        title: req.body.title,
        body: req.body.body
    });
    newReview.save(function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR WRITING REVIEW TO DATABASE");
            return;
        }
        req.movie.reviews.unshift(newReview._id);
        req.user.reviews.unshift(newReview._id);
        req.movie.totalScore += newReview.score;
        Movie.findByIdAndUpdate(req.movie._id, {reviews: req.movie.reviews, totalScore:req.movie.totalScore}, function(err, result){
            if(err){
                console.log(err);
                res.status(500).send("ERROR UPDATING MOVIE IN DATABASE");
                return;
            }
            req.app.locals.config.reviewIdNum++;
            User.findByIdAndUpdate(req.user._id, {reviews: req.user.reviews}, function(err, result){
                if(err){
                    console.log(err);
                    res.status(500).send("ERROR UPDATING USER IN DATABASE");
                    return;
                }
                req.newReview = newReview;
                next();
            });
        });
    });
}

function makeReviewId(uid, movieId, idNum){
    return `${uid}-${movieId}-${idNum}`;
}

function verifyLogin(req, res, next){
    if(!req.session.hasOwnProperty('uid') || req.session.uid !== req.cookies.userid){
        res.status(401).send("ERROR: Please log in to continue.");
        return;
    }
    User.findOne({uid: req.session.uid}, function(err, user){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!user){
            res.status(401).send("ERROR: Please log in to continue.");
            return;
        }
        req.user = user;
        next();
    });
}

function verifyContributingUser(req, res, next){
    if(req.user.userType !== "contributing"){
        res.status(403).send("ERROR: Unauthorized contribution.");
        return;
    }
    req.contributing = true;
    next();
}


function verifyUnique(req, res, next){
    Movie.find()
    .where("title").equals(req.body.title)
    .where("year").equals(req.body.year)
    .exec(function(err, sameMovies){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(sameMovies.length > 0){
            res.status(401).send("ERROR: Duplicate movie");
            return;
        }
        next();
    });
}

function createMovie(req, res, next){
    let movieId = makeMovieId(req.body.title, req.app.locals.config.movieIdNum);
    let movieToAdd = new Movie({
        mid: movieId,
        midNum: req.app.locals.config.movieIdNum,
        title: req.body.title,
        rating: req.body.rating,
        year: req.body.year,
        releaseDay: req.body.releaseDay,
        releaseMonth: req.body.releaseMonth,
        runtime: req.body.runtime,
        genre: req.body.genreList,
        plot: req.body.plot,
        poster: req.body.poster
    });
    movieToAdd._id = mongoose.Types.ObjectId();
    req.movie = movieToAdd;
    req.peopleToUpdateIDs = [];
    req.peopleToUpdate = [];
    next();
}
function checkActors(req, res, next){
    Person.find({name: {$in: req.body.actors}},function(err,findActor){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(req.body.actors.length!==findActor.length){
            res.status(404).send("ERROR: Actor Not found");
            return;
        }
        findActor.forEach(updateActor =>{
            req.movie.actors.push(updateActor._id);
            updateActor.acted.push(req.movie._id);
            if(!req.peopleToUpdateIDs.includes(updateActor._id)){
                req.peopleToUpdateIDs.push(updateActor._id);
                req.peopleToUpdate.push(updateActor);
            }
        }); 
        next();
    });
}
function checkWritters(req, res, next){
    Person.find({name: {$in: req.body.writer}},function(err,findWritter){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(req.body.writer.length!==findWritter.length){
            res.status(404).send("ERROR: Writer not found");
            return;
        }
        findWritter.forEach(updateWritter =>{
            req.movie.writer.push(updateWritter._id);
            updateWritter.written.push(req.movie._id);
            if(!req.peopleToUpdateIDs.includes(updateWritter._id)){
                req.peopleToUpdateIDs.push(updateWritter._id);
                req.peopleToUpdate.push(updateWritter);
            }
        });
        next();
    });
}
function checkDirectors(req, res, next){
    Person.find({name: {$in: req.body.director}},function(err,findDirector){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(req.body.director.length!==findDirector.length){
            res.status(404).send("ERROR: Director Not found");
            return;
        }
        findDirector.forEach(updateDirector =>{    
            req.movie.director.push(updateDirector._id);    
            updateDirector.directed.push(req.movie._id);
            if(!req.peopleToUpdateIDs.includes(updateDirector._id)){
                req.peopleToUpdateIDs.push(updateDirector._id);
                req.peopleToUpdate.push(updateDirector);
            }
        });
        next();
    });
}
function saveMovie(req, res, next){
    req.movie.save(function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR WRITING TO DATABASE");
            return;
        }
        req.app.locals.config.movieIdNum++;
        for(let i = 0; i < req.peopleToUpdateIDs.length; i++){
            Person.findByIdAndUpdate(
                req.peopleToUpdateIDs[i], 
                {
                    acted:    req.peopleToUpdate[i].acted   ,
                    written:  req.peopleToUpdate[i].written ,
                    directed: req.peopleToUpdate[i].directed
                },
                function(err, result){
                    if(err){
                        console.log(err);
                        res.status(500).send("ERROR WRITING TO DATABASE");
                        return;
                    }
                }
            )
        }
        next();
    });
}

function makeMovieId(title, idNum){
    let initials = title.split(' ').map((elt)=>{
        return elt.toLowerCase().charAt(0);
    });
    return initials.join('')+'-'+idNum;
}

function movieNotification(req, res, next){
    req.peopleToUpdate.forEach((person)=>{
        let nid = makeNotificationId(person.pid, req.app.locals.config.notifIdNum);
        let notif = new Notification({
            nid: nid,
            subject: "person",
            subjectName: person.name,
            link: `/movies/${req.movie.mid}`
        });
        notif.save(function(err){
            if(err){
                console.log(err);
                return;
            }
            req.app.locals.config.notifIdNum++;
            Person.findById(person._id).populate('followers').exec(function(err, result){
                if(err) console.log(err);
                result.followers.forEach((follower)=>{
                    follower.notifications.unshift(notif._id);
                    User.findByIdAndUpdate(follower._id, {notifications: follower.notifications}, function(err){
                        if(err) console.log(err);
                    });
                });
            });
        });
    });
    next();
}

function reviewNotification(req, res, next){
    let nid = makeNotificationId(req.user.uid, req.app.locals.config.notifIdNum);
    let notif = new Notification({
        nid: nid,
        subject: "review",
        subjectName: req.user.username,
        link: `/movies/${req.movie.mid}`
    });
    notif.save(function(err){
        if(err) {
            console.log(err);
            return;
        }
        req.app.locals.config.notifIdNum++;
        req.user.followers.forEach((follower)=>{
            User.findById(follower, function(err, result){
                if(err) console.log(err);
                else{
                    result.notifications.unshift(notif._id);
                    User.findByIdAndUpdate(follower, {notifications: result.notifications}, function(err){
                        if(err) console.log(err);
                    });
                }
            })
        });
        
    });
    res.status(201).send(req.newReview);
}

function reCalFreqCollab(req, res, next){
    let collabs = {};
    let collabArray = [];
    let resultCollabs = [];
    Person.find({_id:{$in:req.peopleToUpdateIDs}}).populate('written acted directed').exec(function(err, updatePeople){
        updatePeople.forEach((result)=>{
            if(err){
                console.log(err);
                res.status(500).send("ERROR WRITING TO DATABASE");
                return;
            }
            let accountedForMovies = [];
            result.acted.forEach((movie)=>{
                if(!accountedForMovies.includes(movie._id)){
                    movie.actors.forEach((actorId)=>{
                        handleCollaborator(actorId, result._id, accountedForMovies, collabs);
                    });
                    movie.director.forEach((directorId)=>{
                        handleCollaborator(directorId, result._id, accountedForMovies, collabs);
                    });
                    movie.writer.forEach((writerId)=>{
                        handleCollaborator(writerId, result._id, accountedForMovies, collabs);
                    });
                    accountedForMovies.push(movie._id);
                }
                
            });
            result.directed.forEach((movie)=>{
                if(!accountedForMovies.includes(movie._id)){
                    movie.actors.forEach((actorId)=>{
                        handleCollaborator(actorId, result._id, accountedForMovies, collabs);
                    });
                    movie.director.forEach((directorId)=>{
                        handleCollaborator(directorId, result._id, accountedForMovies, collabs);
                    });
                    movie.writer.forEach((writerId)=>{
                        handleCollaborator(writerId, result._id, accountedForMovies, collabs);
                    });
                    accountedForMovies.push(movie._id);
                }
            });
            result.written.forEach((movie)=>{
                if(!accountedForMovies.includes(movie._id)){
                    movie.actors.forEach((actorId)=>{
                        handleCollaborator(actorId, result._id, accountedForMovies, collabs);
                    });
                    movie.director.forEach((directorId)=>{
                        handleCollaborator(directorId, result._id, accountedForMovies, collabs);
                    });
                    movie.writer.forEach((writerId)=>{
                        handleCollaborator(writerId, result._id, accountedForMovies, collabs);
                    });
                }
            });
            for(collabId in collabs){
                collabArray.push({id: collabId, count: collabs[collabId]});
            }
            collabArray.sort((a,b)=>b.count - a.count);
            collabArray.forEach((obj)=>{
                resultCollabs.push(obj.id);
            });
            result.collaborators = resultCollabs.slice(0,5);
            result.save(function(err){if(err) throw err;});
        });
        res.status(201).send("Movie successfully created.");
    });
}

function handleCollaborator(collaboratorId, personId, seen, collabs){
    if(collaboratorId.equals(personId)){
        return;
    }
    if(!seen.includes(collaboratorId)){
        seen.push(collaboratorId);
        if(!collabs.hasOwnProperty(collaboratorId)){
            collabs[collaboratorId] = 1;
        }
        else{
            collabs[collaboratorId]++;
        }
    }
}

function makeNotificationId(subject, idNum){
    return `${subject}-notif-${idNum}`;
}

module.exports = router;