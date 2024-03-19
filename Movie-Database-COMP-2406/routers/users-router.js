const mongoose = require('mongoose');
const express = require('express');
const Movie = require('../schemas/MovieSchema');
const User = require('../schemas/UserSchema');
const Notification = require('../schemas/NotifSchema');
const bcrypt       = require('bcryptjs');
let router = express.Router();

router.post("/", isDuplicateUser, makeUser, saveUser);
router.get("/:uid", isLoggedIn, isSameUser, getUser, checkFollowing, sendUser);
router.get("/:uid/watchlist", getWatchlist, sendItems);
router.get("/:uid/notifications", isSameUser, getNotifs, sendItems);
router.get("/:uid/followedPeople", getFollowedPeople, sendItems);
router.get("/:uid/followedUsers", getFollowedUsers, sendItems);
router.get("/:uid/recommended", getWatchlist, getTopGenresAndDecades, getRecommended, sendItems);
router.get("/:uid/followers", getFollowers, sendItems);
router.get("/:uid/reviews", getReviews, sendItems);

router.put("/:uid", verifyLogin, isSameUser, getUser, updateContributionStatus);
router.put("/:uid/watchlist", verifyLogin, isSameUser, getUser, addToWatchList);
router.post("/:uid/followers", verifyLogin, isSameUser, linkFollower, followNotification);
router.delete("/:uid/watchlist/:mid", verifyLogin, isSameUser, getUser, removeFromWatchList);
router.delete("/:uid/followers/:fid", verifyLogin, isFollower, deleteFollower);
router.delete("/:uid/notifications", verifyLogin, isSameUser, deleteNotifications);


function isDuplicateUser(req,res,next){
    User.findOne({username:req.body.username},function(err,taken){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(taken) {
            res.status(401).send("ERROR: Username already in use.");
            return;
        }
        next();
    });
}
function makeUser(req,res,next){    
    bcrypt.hash(req.body.password,8,function(err,encyptPass){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }

        let createUser = new User({
            uid: makeUserId(req.body.username,req.app.locals.config.userIdNum),
            username: req.body.username, 
            password: encyptPass,
            userType: "basic"
        });
        createUser._id = mongoose.Types.ObjectId();

        req.user = createUser;
        next();
    });
}
    
function saveUser(req,res,next){
    req.user.save(function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        req.app.locals.config.userIdNum++;
        res.status(201).send();
    });
}

function makeUserId(username, idNum){
    return username+"-"+idNum;
}

function isSameUser(req, res, next){
    if(!req.session.hasOwnProperty('uid')){
        req.sameUser = false;
        next();
        return;
    }
    if(req.cookies.userid !== req.session.uid){
        req.sameUser = false;
        next();
        return;
    }
    req.sameUser = req.params.uid === req.session.uid;
    next();
}

function verifyLogin(req, res, next){
    if(!req.session.hasOwnProperty('uid')){
        res.status(401).send("ERROR: Please log in to continue.");
        return;
    }
    if(req.cookies.userid !== req.session.uid){
        res.status(403).send("ERROR: Unauthorized access attempt.");
        return;
    }
    next();
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

function getUser(req, res, next){
    User.findOne({uid: req.params.uid}, function(err, user){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!user){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.user = user;
        next();
    });
    
}

function checkFollowing(req, res, next){
    if(req.session.hasOwnProperty('uid')){
        User.findOne({uid: req.session.uid}, function(err, result){
            if(err){
                console.log(err);
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            req.isFollowing = req.user.followers.includes(result._id);
            next();
        });
    }
    else{
        req.isFollowing = false;
        next();
    }
}

function sendUser(req, res, next){
    res.format({
        "application/json": ()=>{res.status(200).send(JSON.stringify(req.user))},
        "text/html": ()=>{
            res.render("user", {user: req.user, same: req.sameUser, loggedIn: req.loggedIn, uid: req.session.uid, isFollowing:req.isFollowing});
        }
    });
}

function getWatchlist(req, res, next){
    User.find({uid: req.params.uid})
    .populate("watchList")
    .select("watchList")
    .exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].watchList.map((movie)=>{
            return {
                mid: movie.mid, 
                title:movie.title, 
                poster:movie.poster,
                genre:movie.genre,
                year:movie.year
            };
        });
        next();
    });
}

function getNotifs(req, res, next){
    if(!req.sameUser){
        res.status(403).send("ERROR: Unauthorized access of notifications");
        return;
    }
    User.find({uid: req.params.uid})
    .select("notifications")
    .populate("notifications").exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].notifications;
        next();
    });
}

function getFollowedPeople(req, res, next){
    User.find({uid: req.params.uid})
    .select("followedPeople")
    .populate("followedPeople").exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].followedPeople;
        next();
    });
}

function getFollowedUsers(req, res, next){
    User.find({uid: req.params.uid})
    .select("followedUsers")
    .populate("followedUsers").exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].followedUsers;
        next();
    });
}

function getFollowers(req, res, next){
    User.find({uid: req.params.uid})
    .select("followers")
    .populate("followers").exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].followers;
        next();
    });
}

function getTopGenresAndDecades(req, res, next){
    let watchList = req.loaditems;
    let ignoreIds = [];
    let genres = {};
    let years = {};
    let sortedGenres = [];
    let sortedYears = [];
    watchList.forEach((movie)=>{
        ignoreIds.push(movie.mid);
        movie.genre.forEach((genre)=>{
            if(genres.hasOwnProperty(genre)){
                genres[genre]++;
            }
            else{
                genres[genre] = 1;
            }
        });
        if(!years.hasOwnProperty(decade(movie.year))){
            years[decade(movie.year)] = 1;
        }
        else{
            years[decade(movie.year)]++;
        }
    });
    Object.keys(genres).forEach((genre)=>{
        sortedGenres.push({ genre:genre, hits:genres[genre] });
    });
    Object.keys(years).forEach((year)=>{
        sortedYears.push({year: year, hits: years[year]});
    })
    sortedGenres.sort(sortByHits);
    sortedYears.sort(sortByHits);
    let genreSeed = sortedGenres.slice(0, 3).map((genreHit)=>{return genreHit.genre});
    let yearSeed = sortedYears.slice(0,3).map((yearHit)=>{return parseInt(yearHit.year)});
    let temp = [];
    yearSeed.forEach((decade)=>{
        for(let i = decade + 1; i < decade + 10; i++){
            temp.push(i);
        }
    });
    yearSeed = yearSeed.concat(temp);
    req.genreSeed = genreSeed;
    req.yearSeed = yearSeed;
    req.ignoreIds = ignoreIds;
    next();
}

function getRecommended(req, res, next){
    Movie.find()
    .where("genre").in(req.genreSeed)
    .where("year").in(req.yearSeed)
    .where("mid").nin(req.ignoreIds)
    .limit(10)
    .exec(function(err, results){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        req.loaditems = results.map((movie)=>{
            return {mid: movie.mid, title:movie.title, poster:movie.poster};
        });
        next();
    });
}

function sortByHits(a,b){
    return b.hits-a.hits;
}

function getReviews(req, res, next){
    User.find({uid: req.params.uid})
    .select("reviews")
    .populate("reviews").exec(function(err, users){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(users.length === 0){
            res.status(404).send("COULD NOT FIND THAT USER");
            return;
        }
        req.loaditems = users[0].reviews;
        console.log(req.loaditems);
        next();
    });
}

function sendItems(req, res, next){
    res.format({
        "application/json": ()=>{
            res.status(200).send(JSON.stringify(req.loaditems));
        }
    });
}

function decade(year){
    return Math.floor(year / 10) * 10;
}

function updateContributionStatus(req, res, next){
    if(!req.sameUser){
        res.status(403).send("UNAUTHORIZED USER MANAGEMENT.");
        return;
    }
    if(!req.body.hasOwnProperty('type') || !(req.body.type === "basic" || req.body.type === "contributing")){
        console.log(req.body.type !== "contributing")
        res.status(401).send("BAD REQUEST.");
        return;
    }
    User.findByIdAndUpdate(req.user._id, {userType: req.body.type}, function(err){
        if(err){
            res.status(500).send("ERROR WRITING TO DATABASE");
            console.log(err);
            return;
        }
        res.status(200).send("Successfully updated contribution status.");
    });
}

function addToWatchList(req, res, next){
    if(!req.sameUser){
        res.status(403).send("UNAUTHORIZED WATCHLIST ADDITION.");
        return;
    }
    if(!req.body.hasOwnProperty('mid')){
        res.status(401).send("BAD REQUEST.");
        return;
    }
    Movie.findOne({mid: req.body.mid}, function(err, result){
        if(err){
            res.status(500).send("ERROR READING FROM DATABASE");
            console.log(err);
            return;
        }
        if(!result){
            res.status(404).send("ERROR: COULD NOT FIND THAT MOVIE.");
            return;
        }
        if(req.user.watchList.includes(result._id)){
            res.status(401).send("You already have that movie in your watchlist!");
            return;
        }
        req.user.watchList.push(result._id);
        User.findByIdAndUpdate(req.user._id, {watchList: req.user.watchList}, function(err){
            if(err){
                res.status(500).send("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            res.status(200).send("Successfully added movie to your watchlist.");
        });
    });
}

function removeFromWatchList(req, res, next){
    if(!req.sameUser){
        res.status(403).send("UNAUTHORIZED WATCHLIST DELETION.");
        return;
    }
    Movie.findOne({mid: req.params.mid}, function(err, result){
        if(err){
            res.status(500).send("ERROR READING FROM DATABASE");
            console.log(err);
            return;
        }
        if(!result){
            res.status(404).send("ERROR: COULD NOT FIND THAT MOVIE.");
            return;
        }
        if(!req.user.watchList.includes(result._id)){
            res.status(401).send("You do not have that movie in your watchlist!");
            return;
        }
        let newWatchList = req.user.watchList.filter(movieID=>{
            return !movieID.equals(result._id);
        });
        User.findByIdAndUpdate(req.user._id, {watchList: newWatchList}, function(err){
            if(err){
                res.status(500).send("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            res.status(200).send("Successfully removed movie from your watchlist.");
        });
    });
}

function linkFollower(req, res, next){
    if(req.sameUser){
        res.status(401).send("You cannot follow yourself!");
        return;
    }
    findLeader(req).then((leader)=>{
        req.leader = leader;
        return findFollower(req);
    }).then((follower)=>{
        req.follower = follower;
        if(req.leader.followers.includes(req.follower._id) || req.follower.followedUsers.includes(req.leader._id)){
            res.status(401).send("You have already followed that user!");
            return;
        }
        req.leader.followers.push(req.follower._id);
        req.follower.followedUsers.push(req.leader._id);
        User.findByIdAndUpdate(req.leader._id, {followers: req.leader.followers}, function(err, newLeader){
            if(err){
                res.status(500).send("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            User.findByIdAndUpdate(req.follower._id, {followedUsers: req.follower.followedUsers}, function(err, newFollower){
                if(err){
                    res.status(500).send("ERROR WRITING TO DATABASE");
                    console.log(err);
                    return;
                }
                res.status(201).send("User successfully followed.");
                next();
            });
        })
    }).catch((err)=>{
        if(err === "ERROR WRITING TO DATABASE"){
            res.status(500);
        }
        else if(err === "COULD NOT FIND THAT USER."){
            res.status(404);
        }
        res.send(err);
    })
}

function findLeader(req){
    return new Promise((resolve, reject)=>{
        User.findOne({uid: req.params.uid}, function(err, leader){
            if(err){
                reject("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            if(!leader){
                reject("COULD NOT FIND THAT USER.");
                return;
            }
            resolve(leader);
        });
    });
}

function findFollower(req){
    return new Promise((resolve, reject)=>{
        User.findOne({uid: req.session.uid}, function(err, follower){
            if(err){
                console.log(err);
                reject("ERROR WRITING TO DATABASE");
                return;
            }
            if(!follower){
                reject("COULD NOT FIND THAT USER.");
                return;
            }
            resolve(follower);
        });
    });
}

function isFollower(req, res, next){
    if(req.session.uid !== req.params.fid){
        res.status(403).send("UNAUTHORIZED FOLLOWER MODIFICATION.");
        return;
    }
    findLeader(req).then((leader)=>{
        User.findOne({uid: req.params.fid}, function(err, follower){
            if(err){
                res.status(500).send("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            if(!follower){
                res.status(404).send("COULD NOT FIND THAT USER.");
                return;
            }
            req.isFollower = leader.followers.includes(follower._id);
            req.leader = leader;
            req.follower = follower;
            next();
        });
    }).catch((err)=>{
        if(err === "ERROR WRITING TO DATABASE"){
            res.status(500);
        }
        else if(err === "COULD NOT FIND THAT USER."){
            res.status(404);
        }
        console.log(err);
        res.send(err);
    });
}

function deleteFollower(req, res, next){
    if(!req.isFollower){
        res.status(403).send("You haven't followed that person!");
        return;
    }
    let newFollowers = req.leader.followers.filter((follower)=>{
        return !follower.equals(req.follower._id);
    });
    let newFollowedUsers = req.follower.followedUsers.filter((followed)=>{
        return !followed.equals(req.leader._id);
    });
    User.findByIdAndUpdate(req.leader._id, {followers: newFollowers}, function(err, result){
        if(err){
            res.status(500).send("ERROR WRITING TO DATABASE");
            console.log(err);
            return;
        }
        User.findByIdAndUpdate(req.follower._id, {followedUsers: newFollowedUsers}, function(err, result){
            if(err){
                res.status(500).send("ERROR WRITING TO DATABASE");
                console.log(err);
                return;
            }
            res.status(200).send("Successfully unfollowed user.");
        })
    });
}

function followNotification(req, res, next){
    let nid = makeNotificationId(req.follower.uid, req.app.locals.config.notifIdNum);
    let notif = new Notification({
        nid: nid,
        subject: "follow",
        subjectName: req.follower.username,
        link: `/users/${req.follower.uid}`
    });
    notif.save(function(err){
        if(err) {
            console.log(err);
            return;
        }
        req.app.locals.config.notifIdNum++;
        User.findById(req.leader._id, function(err, result){
            if(err) console.log(err);
            else{
                result.notifications.unshift(notif._id);
                User.findByIdAndUpdate(req.leader._id, {notifications: result.notifications}, function(err){
                    if(err) console.log(err);
                });
            }
        });
    });
    res.status(201).send(req.newReview);
}

function makeNotificationId(subject, idNum){
    return `${subject}-notif-${idNum}`;
}

function deleteNotifications(req, res, next){
    if(!req.sameUser){
        res.status(403).send("ERROR: UNAUTHORIZED NOTIFICATION WIPE.");
        return;
    }
    User.findOneAndUpdate({uid: req.params.uid}, {notifications: []}, function(err, result){
        if(err){
            res.status(500).send("ERROR DELETING NOTIFICATIONS");
            console.log(err);
            return;
        }
        res.status(200).send("Notifications deleted successfully.");
    });
}

module.exports = router;