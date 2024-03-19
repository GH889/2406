const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const faker = require('faker');
const bcrypt =require('bcryptjs');
const encrypSeed = 8;
let Movie = require('./schemas/MovieSchema');
let User = require('./schemas/UserSchema');
let Review = require('./schemas/ReviewSchema');
let Notification = require('./schemas/NotifSchema');
let Person = require('./schemas/PersonSchema');

const app = express();
app.locals.config = require('./config.json');
app.locals.config.movieIdNum = 0;
app.locals.config.personIdNum = 0;
app.locals.config.reviewIdNum = 0;
app.locals.config.userIdNum = 0;
app.locals.config.notifIdNum = 0;

mongoose.connect('mongodb://localhost', {useNewUrlParser:true, useFindAndModify:false});

const STARTING_USERS = 1000;
let numCollabsComputed = 0;
let numMoviesUpdated = 0;

let allMovies = [];
let people = {};
let allPeople = [];
let users = {};
let allUsers = [];
let allReviews = [];


let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function(){
    console.log("DB CONNECTED");
    db.db.dropDatabase();
    readMovieData().then((data)=>{
        console.log("Generating movies and people...")
        let movieData = JSON.parse(data);
        return generateMovies(movieData);
    })
    .then(storeMovies)
    .then((outcome)=>{
        console.log(outcome);
        console.log("Generating users and reviews...");
        return generateUsers();
    })
    .then((outcome)=>{
        console.log(outcome);
        generateWatchlists();
        generateUserFollowers();
        generatePeopleFollowers();
        generateReviews();
        return new Promise((resolve, reject)=>{
            User.insertMany(allUsers, function(err, result){
                if(err){
                    reject("Error saving users.");
                    return;
                }
                console.log("User count: "+result.length);
                Review.insertMany(allReviews, function(err, result){
                    if(err){
                        console.log(err);
                        reject("Error saving reviews");
                        return;
                    }
                    console.log("Review count: "+result.length);
                    resolve("Finished generating users and reviews.");
                })
            });
        });
    })
    .then((outcome)=>{
        console.log(outcome);
        console.log("Updating config file...");
        return new Promise((resolve, reject)=>{
            fs.writeFile("config.json", JSON.stringify(app.locals.config), (err)=>{
                if(err) reject(err);
                resolve("Config file updated successfully.");
            });
        });  
    })
    .then((outcome)=>{
        console.log(outcome);
        console.log("Computing frequent collaborators...");
        Person.find({}).exec((err, result)=>{
            if(err) throw err;
            result.forEach((personObj)=>{
                findFrequentCollab(personObj.name);
            });
        });

        console.log("Updating movie review scores...");
        allMovies.forEach((movie)=>{
            Movie.findByIdAndUpdate(movie._id, {totalScore: movie.totalScore, reviews: movie.reviews}, function(err, result){
                if(err) throw err;
                numMoviesUpdated++;
                if(numMoviesUpdated === allMovies.length){
                    console.log("Movie review scores updated successfully.");
                    if(numCollabsComputed === allPeople.length){
                        db.close();
                    }
                }
            });
        });
    })
    .catch((err)=>{
        console.log(err);
    });
});

function readMovieData(){
    return new Promise((resolve, reject)=>{
        fs.readFile(app.locals.config.datafile, (err, data)=>{
            if(err){
                reject(err);
            }
            else{
                resolve(data);
            }
        })
    })
}

function generateMovies(movieData){
    
    return new Promise((resolve, reject)=>{
        try{
            let numGenerated = 0;
            movieData.forEach((movie)=>{
                let movieId = makeMovieId(movie.Title, app.locals.config.movieIdNum); //Making the movie object itself
                let releaseDate = movie.Released.split(' ');
                if(releaseDate[0] === 'N/A'){
                    releaseDate = [1,1,1];
                }
                else{
                    releaseDate[1] = getMonthNum(releaseDate[1]) + "";
                }
                let rt= movie.Runtime.split(' ')[0];
                if(rt === 'N/A'){
                    rt = 1;
                }
                let movieToAdd = new Movie({
                    mid: movieId,
                    midNum: app.locals.config.movieIdNum,
                    title: movie.Title,
                    rating: movie.Rated,
                    year: movie.Year,
                    releaseDay: releaseDate[0],
                    releaseMonth: releaseDate[1],
                    runtime: rt,
                    genre: movie.Genre,
                    plot: movie.Plot,
                    poster: movie.Poster
                });
                app.locals.config.movieIdNum++;
                movieToAdd._id = mongoose.Types.ObjectId();
                movie.Actors.forEach((name)=>{
                    addPersonToMovie(name, movieToAdd, "actors");
                });
                movie.Director.forEach((name)=>{
                    addPersonToMovie(name, movieToAdd, "director");
                });
                movie.Writer.forEach((name)=>{
                    addPersonToMovie(name, movieToAdd, "writer");
                });
                allMovies.push(movieToAdd);
            });
            resolve("Movie and person generation successful.");
        }
        catch(err){
            reject(err);
        }
    });
}

function addPersonToMovie(name, movie, position){
    if(!people.hasOwnProperty(name)){
        let newPerson = new Person({
            pid: makePersonId(name, app.locals.config.personIdNum),
            name: name,
        });
        app.locals.config.personIdNum++;
        newPerson._id = mongoose.Types.ObjectId();
        allPeople.push(newPerson);
        people[name] = newPerson;
    }

    let currPerson = people[name];
    let positionMap = {
        "actors": "acted",
        "writer": "written",
        "director": "directed"
    }
    currPerson[positionMap[position]].push(movie._id);
    movie[position].push(currPerson._id);
}

function storeMovies(){
    return new Promise((resolve, reject)=>{
        Movie.insertMany(allMovies, function(err, result){
            if(err) {
                reject("Error saving movies.");
                console.log(err);
                return;
            }
            console.log("Movie count: "+result.length);
            Person.insertMany(allPeople, function(err, result){
                if(err) {
                    reject("Error saving people.");
                    return;
                }
                resolve("Finished generating movies and people.");
                console.log("Person count: "+result.length);
            });
        });
    });
}

function makeMovieId(title, idNum){
    let initials = title.split(' ').map((elt)=>{
        return elt.toLowerCase().charAt(0);
    });
    return initials.join('')+'-'+idNum;
}

function makePersonId(name, idNum){
    return name.toLowerCase().split(' ').join('').replace('.','') + idNum;
}

function generateUsers(){
    return new Promise((resolve, reject)=>{
        let numUsersCreated = 0;
        for(let i = 0; i < STARTING_USERS; i++){
            let uname = faker.internet.userName();
            bcrypt.hash(faker.internet.password(),encrypSeed,function(err,ePass){
                if(err){
                    console.log(err);
                    return;
                }
                let uid = makeUserId(uname, app.locals.config.userIdNum);
                app.locals.config.userIdNum++;
                let newUser = new User({
                    uid: uid,
                    username: uname,
                    password: ePass,
                    userType: "basic"
                });
                newUser._id = mongoose.Types.ObjectId();
                users[uname] = newUser;
                allUsers.push(newUser);
                numUsersCreated++;
                if(numUsersCreated == STARTING_USERS){
                    resolve("User generation successful.");
                }
            });
        }
    });
}

function generateWatchlists(){
    allUsers.forEach((user)=>{
        for(let i = 0; i < 10; i++){
            let selectedIndex = rng(allMovies.length);
            if(!user.watchList.includes(allMovies[selectedIndex]._id)){
                user.watchList.push(allMovies[selectedIndex]._id);
            }
        }
    });
}

function generateUserFollowers(){
    allUsers.forEach((user)=>{
        for(let i = 0; i < 10; i++){
            let selectedIndex = rng(allUsers.length);
            if(!user.followedUsers.includes(allUsers[selectedIndex]._id) && allUsers[selectedIndex]._id !== user._id){
                user.followedUsers.push(allUsers[selectedIndex]._id);
                allUsers[selectedIndex].followers.push(user._id);
            }
        }
    });
}

function generatePeopleFollowers(){
    allUsers.forEach((user)=>{
        for(let i = 0; i < 10; i++){
            let selectedIndex = rng(allPeople.length);
            if(!user.followedPeople.includes(allPeople[selectedIndex]._id)){
                user.followedPeople.push(allPeople[selectedIndex]._id);
                allPeople[selectedIndex].followers.push(user._id);
            }
        }
    });
}

function generateReviews(){
    allUsers.forEach((user)=>{
        let reviewed = [];
        for(let i = 0; i < 3; i++){
            let selectedIndex = rng(allMovies.length);
            if(!reviewed.includes(allMovies[selectedIndex]._id)){
                reviewed.push(allMovies[selectedIndex]._id);
                let newReview = new Review({
                    rid: makeReviewId(user.uid, allMovies[selectedIndex].mid, app.locals.config.reviewIdNum),
                    uid: user.uid,
                    username: user.username,
                    mid: allMovies[selectedIndex].mid,
                    movieTitle: allMovies[selectedIndex].title,
                    score: rng(10) + 1,
                    type: (rng(2)) ? "full" : "basic"
                });
                app.locals.config.reviewIdNum++;
                newReview._id = mongoose.Types.ObjectId();
                if(newReview.type === "full"){
                    newReview.title = faker.lorem.sentence();
                    newReview.body = faker.lorem.sentences();
                }
                allMovies[selectedIndex].totalScore += newReview.score;
                allMovies[selectedIndex].reviews.unshift(newReview._id);
                users[user.username].reviews.unshift(newReview._id);
                allReviews.push(newReview);
            }
        }
    });
}

function rng(max){
    return Math.floor(Math.random() * max);
}

function findFrequentCollab(personName){
    let collabs = {};
    let collabArray = [];
    let resultCollabs = [];
    Person.findOne({name:personName}).populate('written acted directed').exec(function(err, result){
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
        people[personName].collaborators = resultCollabs.slice(0,5);
        people[personName].save(function(err){
            if(err) throw err;
            numCollabsComputed++;
            if(numCollabsComputed % 100 === 0){
                console.log(`Computed frequent collaborators ${numCollabsComputed}/${allPeople.length}`);
            }
            if(numCollabsComputed === allPeople.length){
                console.log("Computed frequent collaborators.");
                if(numMoviesUpdated === allMovies.length){
                    db.close();
                }
            }
        })
    });
}

function handleCollaborator(collaboratorId, personId, seen, collabs){
    if(collaboratorId === personId){
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

function getMonthNum(monthStr){
    let months = {
        "Jan":1,
        "Feb":2,
        "Mar":3,
        "Apr":4,
        "May":5,
        "Jun":6,
        "Jul":7,
        "Aug":8,
        "Sep":9,
        "Oct":10,
        "Nov":11,
        "Dec":12
    }
    return months[monthStr];
}

function makeUserId(username, idNum){
    return username+"-"+idNum;
}

function makeReviewId(uid, movieId, idNum){
    return `${uid}-${movieId}-${idNum}`;
}

function makeNotificationId(subject, idNum){
    return `${subject}-notif-${idNum}`;
}

function makeNotification(subject, subjectName, notifLink, idNum){
    let notifId = makeNotificationId(subject, idNum);
    notifications[notifId] = {
        id: notifId,
        for: uid,
        subject: subject,
        subjectName: subjectName, 
        link: notifLink
    }
    return notifId;
}