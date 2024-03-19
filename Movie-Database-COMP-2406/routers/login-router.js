const express = require('express');
const User = require('../schemas/UserSchema');
const bcrypt = require('bcryptjs');
let router = express.Router();


router.get("/",loadLoginPage);
router.post("/",getUser,validPassword,generateSession);




function loadLoginPage(req,res,next){
    res.render("login");
}

function getUser(req, res, next){
    User.findOne({username: req.body.username}, function(err, user){
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

function validPassword(req,res,next){
    bcrypt.compare(req.body.password, req.user.password,function(err,valid){
        if(err){
            console.log(err);
            res.status(500).send("ERROR READING FROM DATABASE");
            return;
        }    
        if(!valid) {
            res.status(401).send("ERROR: Password or Username is incorrect.");
            return;
        }
        next();
    }); 
};

function generateSession(req,res,next){
    req.session.uid = req.user.uid;
    req.session.userType = "basic";
    res.cookie('userid', req.user.uid);
    res.status(201).send(req.user.uid);
};

module.exports = router;