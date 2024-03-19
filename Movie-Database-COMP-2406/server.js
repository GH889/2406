const cookieParser   = require('cookie-parser'          )         ;
const express        = require('express'                )         ;
const session        = require('express-session'        )         ;
const Movie          = require('./schemas/MovieSchema'  )         ;
const app            = express(                         )         ;
const fs             = require('fs'                     )         ;
const mongoose       = require('mongoose'               )         ;
const mongoDBSession = require('connect-mongodb-session')(session);

const PORT           = 3000;
const store = new mongoDBSession({uri:'mongodb://localhost/',collection:"mySessions"})

app.use(session({secret: '1fa2e676b7f277f4972d4cf922f9d5f1eb145a3b5175d83789e989000c52a3b8', resave:false, saveUninitialized:false, store:store}));

app.use(express.urlencoded({extended: false}));
app.use(express.static    ("scripts"        ));
app.use(express.static    ("styles"         ));
app.use(express.json      (                 ));
app.use(cookieParser      (                 ));

app.set('view engine', 'pug');
app.locals.config = require('./config.json');
console.log(app.locals.config);

let  movieRouter = require( "./routers/movies-router");
let   userRouter = require(  "./routers/users-router");
let  loginRouter = require(  "./routers/login-router");
let peopleRouter = require( "./routers/people-router");

app.use("/movies" ,movieRouter );
app.use("/users"  ,userRouter  );
app.use("/login"  ,loginRouter );
app.use("/people" ,peopleRouter);

app.get("/logout",(req,res) => {
    req.session.destroy((err) =>{ 
        if(err) {console.log(err); throw err;}
        res.redirect("login");
    });
});

mongoose.connect('mongodb://localhost/', {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify:false, useCreateIndex:true});


let db = mongoose.connection;
app.locals.db = db;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    console.log("Connected to dionysusDB database.");
    app.get("/", getNewReleases, getNewAdds, isLoggedIn, renderHome);
    console.log("Listening on http://localhost:3000");
    app.listen(PORT);
    setInterval(backupConfig, 60000); //Backing up the config file, because you never know what could happen.
});

function renderHome(req, res, next){
    if(req.loggedIn){res.render("home",{releases:res.newReleases, adds:res.newAdded, loggedIn: true, uid: req.session.uid});
    }else{res.render("home",{releases:res.newReleases, adds:res.newAdded, loggedIn: false});}
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

function getNewReleases(req, res, next){
    Movie
        .find()
        .limit(5)
        .sort("-year")
        .sort("-releaseMonth")
        .sort("-releaseDay")
        .exec(function(err, result){
            if(err) {
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            res.newReleases = result;
            next();
        });
}

function getNewAdds(req, res, next){
    Movie
        .find()
        .limit(5)
        .sort("-midNum")
        .exec(function(err, result){
            if(err) {
                res.status(500).send("ERROR READING FROM DATABASE");
                return;
            }
            res.newAdded = result;
            next();
        });
}

function backupConfig(){
    fs.writeFile("config.json", JSON.stringify(app.locals.config), (err)=>{
        if(err) {
            console.log("Error backing up config file: ", err.message);
            return;
        }
        console.log("Config file updated successfully.");
    });
}


// OLD SERVER
/*
let server = http.createServer((request, response)=>{
    if(request.method === "GET"){
        console.log(request.url);
        if(request.url === "/" || request.url === "/home"){
            handleGetHome(request,response);
        }
        else if (request.url.slice(0,8) === "/movies?"){
            handleSearchMovies(request, response);
        }
        else if (request.url === "/movies/example-id"){
            handleGetMovie(request, response);
        }
        else if (request.url === "/movies/example-id/recommendations"){
            handleGetMovieRecommendations(request, response);
        }
        else if (request.url === "/movies/example-id/reviews"){
            handleGetMovieReviews(request, response);
        }
        else if(request.url === "/movies/addForm"){
            handleGetAddMovie(request,response);
        }
        else if (request.url === "/users/same-user"){
            handleGetUser(request, response, true);
        }
        else if (request.url === "/users/same-user/watchlist"){
            handleGetUserWatchlist(request, response, true);
        }
        else if (request.url === "/users/same-user/recommended"){
            handleGetUserRecommended(request, response);
        }
        else if (request.url === "/users/same-user/reviews"){
            handleGetUserReviews(request, response, true);
        }
        else if (request.url === "/users/same-user/notifications"){
            handlegetUserNotifications(request, response);
        }
        else if (request.url === "/users/example-id"){
            handleGetUser(request, response, false);
        }
        else if (request.url === "/users/example-id/watchlist"){
            handleGetUserWatchlist(request, response, false);
        }
        else if (request.url === "/users/example-id/reviews"){
            handleGetUserReviews(request, response, false);
        }
        else if(request.url.slice(0,8) === "/people?"){
            handleSearchpeople(request,response);
        }
        else if(request.url === "/people/example-id"){
            handleGetPerson(request,response);
        }
        else if(request.url === "/people/addForm"){
            handleGetAddPerson(request,response);
        }
        else if(request.url === "/login"){
            handleGetLogin(request,response);
        }
        else if(request.url.slice(-3) === ".js"){
            let splitUrl = request.url.split('/');
            let jsName = splitUrl[splitUrl.length - 1];
            fs.readFile(`./scripts/${jsName}`, (err, data) => {
                if(err){
                    send500(response);
                }
                else{
                    response.statusCode=200;
                    response.write(data);
                    response.end();
                }
            })
        }
        else if(request.url.slice(-4) === ".css"){
            let splitUrl = request.url.split('/');
            let cssName = splitUrl[splitUrl.length - 1];
            fs.readFile(`./styles/${cssName}`, (err, data) => {
                if(err){
                    send500(response);
                }
                else{
                    response.statusCode=200;
                    response.write(data);
                    response.end();
                }
            })
        }
        else{
            send404(response);
        }
    }
    else if(request.method === "POST"){

    }
    else if(request.method === "PUT"){
        
    }
    else{
        send404(response);
    }
});

// try{
//     //Okay, I know the file reads aren't async, but otherwise I would be in callback hell
//     //with these.
//     let mvData = loadMovies();
//     movies = JSON.parse(mvData);
//     let pData = loadPeople();
//     people = JSON.parse(pData);
//     let uData = loadUsers();
//     users = JSON.parse(uData);
//     let rData = loadReviews();
//     reviews = JSON.parse(rData);
//     let nData = loadNotifs();
//     notifications = JSON.parse(nData);
//     server.listen(PORT);
//     console.log("Listening on localhost:3000...");
// } catch (error){
//     console.log(error);
// }


function loadMovies(){
    return fs.readFileSync('./movie-data/movies.json');
}

function loadPeople(){
    return fs.readFileSync('./movie-data/people.json');
}

function loadUsers(){
    return fs.readFileSync('./movie-data/users.json');
}

function loadReviews(){
    return fs.readFileSync('./movie-data/reviews.json');
}

function loadNotifs(){
    return fs.readFileSync('./movie-data/notifs.json');
}

function handleGetHome(request, response){
    response.statusCode = 200;
    let newReleases = getNewReleases();
    let newAdds = getNewAdds();
    response.write(pug.renderFile("./views/home.pug", {releases:newReleases, adds:newAdds}));
    response.end();
}

function handleGetPerson(request, response){
    let personId = request.url.split("/");
    //personId = personId[personId.length-1];
    personId = "sampeckinpah0";

    let returnPerson = people[personId]; 
    
    if(request.headers.accept === "application/json"){
        response.statusCode = 200;
        response.write(JSON.stringify(returnPerson));
        response.end();
    }
    else{
        response.statusCode = 200;
        let collabMovObj = []
        returnPerson.collaborators.forEach((movie)=>{
            collabMovObj.push(people[movie]);
        });
        
        let actedMovObj = [];
        returnPerson.acted.forEach((movie)=>{
            actedMovObj.push(movies[movie]);
        });
        
        let directedMovObj = [];
        returnPerson.directed.forEach((movie)=>{
            directedMovObj.push(movies[movie]);
        });
        
        let writtenMovObj = [];
        returnPerson.written.forEach((movie)=>{
            writtenMovObj.push(movies[movie]);
        });

        response.write(pug.renderFile("./views/person.pug", {
            n:returnPerson.name,
            c:collabMovObj,
            a:actedMovObj,
            d:directedMovObj,
            w:writtenMovObj     
        }
        ));
        response.end();
    }
}

function handleGetMovie(request, response){
    response.statusCode = 200;
    let movie = movies["tgpi-4"];
    let actors = [];
    movie.actors.forEach((id) =>{
        actors.push(people[id]);
    });
    let director = [];
    movie.director.forEach((id) =>{
        director.push(people[id]);
    });
    let writer = [];
    movie.writer.forEach((id) =>{
        writer.push(people[id]);
    });
    response.write(pug.renderFile("./views/movie.pug", {mv: movie, a:actors, w:writer, d:director}));
    response.end();
}

function handleGetMovieRecommendations(request, response){
    response.statusCode = 200;
    let refMovie = movies["tgpi-4"]; //example movie
    let recommendations = [];
    for(const id in movies){
        if(id !== "tgpi-4"){ //Checking to make sure id isn't the requested id
            let checkMovie = movies[id];
            checkMovie.genre.forEach((genre)=>{ //Checking by genre
                refMovie.genre.forEach((refGenre) => {
                    if(genre === refGenre && recommendations.indexOf(movies[id]) < 0){
                        recommendations.push(movies[id]);
                    }
                });
            });
        }
    }
    response.write(JSON.stringify(recommendations.slice(0,5)));
    response.end();
}

function handleGetMovieReviews(request, response){
    response.statusCode = 200;
    response.setHeader("Content-Type","application/json");
    let refMovie = movies["tgpi-4"];
    let reviewArr = [];
    refMovie.reviews.forEach((review)=>{
        reviewArr.push(reviews[review]);
    });
    response.write(JSON.stringify(reviewArr));
    response.end();
}


function handleSearchpeople(request, response){
    let searchName = request.url.slice(8).split('=')[1];
    try{
        let results = Object.values.people.filter((person)=>{
                return person.name.toLowerCase().startsWith(searchName.toLowerCase())    
            });
        if(request.headers.accept === "application/json"){
            response.statusCode = 200;
            response.write(JSON.stringify(results));
            response.end();
        }
    }
    catch(err){
        send401(response);
        console.log(err);
    }
}

function handleSearchMovies(request, response){
    let query = request.url.slice(8).split('&');
    let searchObj = {};
    try{
        query.forEach((param)=>{
            if(param.split('=')[0].includes('title')){
                searchObj.title = param.split('=')[1].toLowerCase();
            }
            else if (param.split('=')[0].includes('person')){
                searchObj.person = param.split('=')[1].toLowerCase();
            }
            else if (param.split('=')[0].includes('genre')){
                searchObj.genre = param.split('=')[1].toLowerCase();
            }
            else if (param.split('=')[0].includes('page')){
                searchObj.page = param.split('=')[1].toLowerCase();
            }
        });
        if(request.headers.accept === "application/json"){
            response.statusCode = 200;
            response.write(JSON.stringify(searchObj));
            response.end();
        }
        else{
            let results = searchMovies(searchObj);
            let searchPage = parseInt(searchObj.page);
            response.statusCode = 200;
            response.write(pug.renderFile("./views/search.pug", {
                movies: results.slice(searchPage * 10, (searchPage + 1) * 10),
                totalPages: Math.ceil(results.length / 10),
                page: searchPage,
                search: searchObj
            }));
            response.end();
        }
    }
    catch(err){
        send401(response);
        console.log(err);
    }
}

//sameUser refers to whether or not we're viewing the 
//page of the user who is currently authenticated
function handleGetUser(request, response, sameUser){
    response.statusCode = 200;
    let refUser;
    if(sameUser){
        refUser = users["rbabaev-0"];
    }
    else{
        refUser = users["alex15-1"];
    }
    response.write(pug.renderFile("./views/user.pug", {user: refUser, same: sameUser}));
    response.end();
}

//sameUser refers to whether or not we're viewing the 
//page of the user who is currently authenticated
function handleGetUserWatchlist(request, response, sameUser){
    response.statusCode = 200;
    let refUser;
    if(sameUser){
        refUser = users["rbabaev-0"];
    }
    else{
        refUser = users["alex15-1"];
    }
    let watchlist = [];
    refUser.watchList.forEach((movie)=>{
        watchlist.push(movies[movie]);
    });
    response.write(JSON.stringify(watchlist));
    response.end();
}

function handleGetUserRecommended(request, response){
    response.statusCode = 200;
    let refUser = users["rbabaev-0"];
    let recommended = [];
    let likedGenres = [];
    refUser.watchList.forEach((movie)=>{
        movies[movie].genre.forEach((genre)=>{
            if(likedGenres.indexOf(genre)<0){
                likedGenres.push(genre);
            }
        })
    });
    recommended = Object.values(movies).filter((movie)=>{
        let foundGenre = false;
        movie.genre.forEach((genre)=>{
            if(likedGenres.indexOf(genre) >= 0){
                foundGenre = true;
            }
        });
        return foundGenre && refUser.watchList.indexOf(movie.id) < 0; 
    })
    response.write(JSON.stringify(recommended.slice(0,10)));
    response.end();
}

function handleGetUserReviews(request, response, sameUser){
    response.statusCode = 200;
    let refUser;
    if(sameUser){
        refUser = users["rbabaev-0"];
    }
    else{
        refUser = users["alex15-1"];
    }
    let userReviews = [];
    refUser.reviews.forEach((id)=>{
        userReviews.push(reviews[id]);
    });
    response.write(JSON.stringify(userReviews));
    response.end();
}

function handlegetUserNotifications(request, response){
    response.statusCode = 200;
    let notifs = [];
    let refUser = users['rbabaev-0'];
    refUser.notifications.forEach((notif)=>{
        notifs.push(notifications[notif]);
    });
    response.write(JSON.stringify(notifs));
    response.end();
}

function handleGetLogin(request,response){
    console.log("?????");
    response.statusCode = 200;
    response.write(pug.renderFile("./views/login.pug"),{});
    response.end();
}

function handleGetAddMovie(request,response){
    response.statusCode = 200;
    response.write(pug.renderFile("./views/addMovie.pug"),{});
    response.end();

}
function handleGetAddPerson(request,response){
    response.statusCode = 200;
    response.write(pug.renderFile("./views/addPerson.pug"),{});
    response.end();

}

function searchMovies(searchObj){
    let toFilter = Object.values(movies);
    //Hits method didn't work, swapped to narrow down approach
    let results = toFilter.filter((movie)=>{
        //Verifying match against title, person, and genre separately
        let titleMatch = searchObj.title !== undefined && movie.title.toLowerCase().includes(searchObj.title);
        let personMatch = true;
        if(searchObj.person !== undefined){ 
            let actorMatch = false;
            movie.actors.forEach((id)=>{
                if(people[id].name.toLowerCase().includes(searchObj.person)){
                    actorMatch = true;
                }
            });
            let directorMatch = false;
            movie.director.forEach((id)=>{
                if(people[id].name.toLowerCase().includes(searchObj.person)){
                    directorMatch = true;
                }
            });
            let writerMatch = false;
            movie.writer.forEach((id)=>{
                if(people[id].name.toLowerCase().includes(searchObj.person)){
                    writerMatch = true;
                }
            });
            personMatch = actorMatch || writerMatch || directorMatch;
        }
        let genreMatch = true;
        if(searchObj.genre !== undefined){
            genreMatch = false;
            movie.genre.forEach((genre)=>{
                if(genre.toLowerCase().includes(searchObj.genre)){
                    genreMatch = true;
                }
            });
        }
        //Then check all three for proper filtering
        return titleMatch && personMatch && genreMatch;
    });
    return results;
}


function send401(response){
    response.statusCode = 401;
    response.write("ERROR: BAD REQUEST");
    response.end();
}

function send404(response){
    response.statusCode = 404;
    response.write("ERROR: PAGE NOT FOUND");
    response.end();
}

function send500(response){
    response.statusCode = 500;
    response.write("SERVER ERROR");
    response.end();
}*/