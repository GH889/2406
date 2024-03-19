const express = require('express');
const mongoose = require('mongoose');
const person = require('../schemas/PersonSchema');
const movie  = require('../schemas/MovieSchema' );
const User   = require('../schemas/UserSchema'  );
let router = express.Router();

router.get("/",getMatchNames,sendNames);
router.get("/addform",verifyLogin, verifyContributingUser,isLoggedIn, getForm);
router.get("/:pid"              , getPerson ,isLoggedIn,isFollowing,sendPerson);
router.get("/:pid/collaborators", getPerson ,makeCollabs  ,sendList      );
router.get("/:pid/acted"        , getPerson ,makeActors   ,sendList      );
router.get("/:pid/wrote"        , getPerson ,makeWirters  ,sendList      );
router.get("/:pid/directed"     , getPerson ,makeDirectors,sendList      );
router.post("/"                 ,verifyLogin,makePerson   ,savePerson    );
router.post("/:pid/followers"   ,verifyLogin,getPerson    ,addFollower   );
router.delete("/:pid/followers" ,verifyLogin,getPerson    ,deleteFollower);

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

function isFollowing(req, res, next){
    if(req.loggedIn){
        verifyLogin(req,res,function(){
            req.followed = req.user.followedPeople.includes(req.person._id);
            next();
        });
    }else{
        req.followed = false;
        next();
    }
}


function deleteFollower(req, res, next){
    if(!req.person.followers.includes(req.user._id)&&!req.user.followedPeople.includes(req.person._id)){
        res.status(403).send("You haven't followed that person!");
        return;
    }
    let deletePerson  = req.person.followers.filter((follower)=>{return !follower.equals(req.user._id);  });
    let deleteUser = req.user.followedPeople.filter((followed)=>{return !followed.equals(req.person._id);});
    person.findByIdAndUpdate(req.person._id, {followers: deletePerson}, function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR WRITING TO DATABASE");
            return;
        }
        User.findByIdAndUpdate(req.user._id, {followedPeople: deleteUser}, function(err){
            if(err){
                console.log(err);
                res.status(500).send("ERROR WRITING TO DATABASE");
                return;
            }
            res.status(200).send("Successfully unfollowed Person.");
        })
    });
} 
function addFollower(req, res, next){
    if( req.person.followers.includes(req.user._id)&&req.user.followedPeople.includes(req.person._id)){
        res.status(401).send("You have already followed that user!");
        return;
    }
    req.person.followers.push(req.user._id);
    req.user.followedPeople.push(req.person._id);
    person.findByIdAndUpdate(req.person._id, {followers: req.person.followers}, function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR WRITING TO DATABASE");
            return;
        }
        User.findByIdAndUpdate(req.user._id, {followedPeople: req.user.followedPeople}, function(err){
            if(err){
                console.log(err);
                res.status(500).send("ERROR WRITING TO DATABASE");
                return;
            }
            res.status(200).send("Person successfully followed.");
        });
    });
}

function getMatchNames(req, res, next){
    person.find().sort({name:1}).exec(function(err, matches){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!matches) {
            res.status(404).send("ERROR: --");
            return;
        }
        let names = [];
        matches.forEach(person =>{
            names.push(person.name);
        });
        req.names = names;
        next();
    });
}
function sendNames(req, res, next){
    res.format({
        "application/json": ()=>{
            res.status(200).send(JSON.stringify(req.names));
        }
    });
}
   

function makeCollabs(req, res, next){
    person.find({_id: {$in: req.person.collaborators}},function(err,c){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!c) {
            res.status(404).send("ERROR: Collaborator Not Found");
            return;
        }
        req.list=c;
        next();
    });
}
function makeWirters(req, res, next){
    movie.find({_id: {$in: req.person.written}},function(err,w){
            if(err){
                console.log(err);
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            if(!w) {
                res.status(404).send("ERROR: Collaborator Not Found");
                return;
            }
            req.list=w;
            next();
        });
}
function makeActors(req, res, next){
    movie.find({_id: {$in: req.person.acted}},function(err,a){
            if(err){
                console.log(err);
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            if(!a) {
                res.status(404).send("ERROR: Collaborator Not Found");
                return;
            }
            req.list=a;
            next();
        });}
function makeDirectors(req, res, next){
    movie.find({_id: {$in: req.person.directed}},function(err,d){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!d) {
            res.status(404).send("ERROR: Collaborator Not Found");
            return;
        }
        req.list=d
        next();
    });
} 

function sendList(req, res, next){
    res.status(200).send(JSON.stringify(req.list));
}

function sendPerson(req, res, next){
    if(req.loggedIn){
        res.render("person",{n:req.person.name,follow:req.followed,loggedIn:req.loggedIn,uid:req.user.uid});
    }else{
        res.render("person",{n:req.person.name,follow:req.followed,loggedIn:req.loggedIn,});
    }
}

function getPerson(req, res, next){
    person.findOne({pid: req.params.pid},function(err, p){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        if(!p){
            res.status(404).send("ERROR: Person Not Found");
            return;
        }
        req.person = p;
        next();
    });
}

function getForm(req, res, next){
    res.render('addPerson',{loggedIn:req.loggedIn,uid:req.user.uid});
}

function makePerson(req,res,next){ 
    let createPerson = new person({
        pid: makePersonId(req.body.name, req.app.locals.config.personIdNum),
        name: req.body.name, 
    });
    createPerson._id = mongoose.Types.ObjectId();

    req.person = createPerson;
    next();
};
function savePerson(req,res,next){
    req.person.save(function(err){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }
        req.app.locals.config.personIdNum++;
        res.status(201).send();
    });
};

function verifyContributingUser(req, res, next){
    if(req.user.userType !== "contributing"){
        res.status(403).send("ERROR: Unauthorized contribution.");
        return;
    }
    req.contributing = true;
    next();
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

function makePersonId(name, idNum){
    return name.toLowerCase().split(' ').join('').replace('.','') + idNum;
}

module.exports = router;