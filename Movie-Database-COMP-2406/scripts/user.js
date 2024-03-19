let followedUsers = [
    {
        id       : "josh10-2",
        username : "josh10",
        link     : "/users/example-id"
    }
]

let followedPeople = [
    {
        id   : "francisfordcoppola123",
        name : "Francis Ford Coppola",
        link : "/people/example-id"
    },
    {
        id   : "alpacino123",
        name : "Al Pacino",
        link : "/people/example-id"
    }
]

function init(){
    let tabs = [];
    let tabContent = document.getElementsByClassName("tabcontent");
    for(let i = 0; i < tabContent.length; i++){
        tabs.push(tabContent[i].id);
    }

    let tabLinks = document.getElementsByClassName("tablink");
    for(let i = 0; i < tabLinks.length; i++){
        tabLinks[i].addEventListener('click', function(){
            openTab(this, tabs[i]);
        });
    }
    document.getElementById("defaultOpen").click();
    let followBtn = document.getElementById("follow-btn");
    if(followBtn !== null){
        followBtn.addEventListener('click', followUser);
    }
    let unfollowBtn = document.getElementById("unfollow-btn");
    if(unfollowBtn !== null){
        unfollowBtn.addEventListener('click', unfollowUser);
    }
    updateWatchList();
    updateFollowedPeople();
    updateFollowedUsers();
    updateReviews();
    updateFollowers();
}

function followUser(){
    userFollowAPI(true).then((response)=>{
        console.log(response);
        updateFollowers();
        document.getElementById("follow-btn").classList.add("restricted");
        document.getElementById("unfollow-btn").classList.remove("restricted");
    }).catch((err)=>{
        alert(err);
    });
}

function unfollowUser(){
    userFollowAPI(false).then((response)=>{
        console.log(response);
        updateFollowers();
        document.getElementById("follow-btn").classList.remove("restricted");
        document.getElementById("unfollow-btn").classList.add("restricted");
    }).catch((err)=>{
        alert(err);
    });
}

function userFollowAPI(isFollowing){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 201){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        let uid = getUserId();
        if(uid === null){
            reject("Please log in to continue.");
            return;
        }
        if(isFollowing){
            xhttp.open("POST", `${window.location.href}/followers`);
        }
        else{
            xhttp.open("DELETE", `${window.location.href}/followers/${uid}`);
        }
        xhttp.send();
    });
}

function getUserId(){
    let decodedCookie = decodeURIComponent(document.cookie);
    decodedCookie = decodedCookie.substring("userid".length+1, decodedCookie.length);
    if(decodedCookie.length === 0){
        return null;
    }
    return decodedCookie;
}

function openTab(btn, tabName){
    let i;
    let tabContent;
    let tabLinks;

    tabContent = document.getElementsByClassName("tabcontent");
    for(i=0; i < tabContent.length; i++){
        tabContent[i].style.display = "none";
    }

    tabLinks = document.getElementsByClassName("tablink");
    for(i=0; i < tabLinks.length; i++){
        tabLinks[i].className = tabLinks[i].className.replace(" highlighted-text","");
    }
    document.getElementById(tabName).style.display="block";
    btn.className += " highlighted-text";
}

function updateWatchList(){
    getMovieList().then((reco)=>{
        renderMovieList(reco, "watchtable");
    }).catch((err)=>{
        alert(err);
    });
}

function getMovieList(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        xhttp.open("GET" ,`${window.location.href}/watchlist`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function renderMovieList(movies, tableId){
    let moviesTable = document.getElementById(tableId);
    moviesTable.innerHTML="";
    moviesList = JSON.parse(movies);
    moviesList.forEach((element)=>{
        let row = document.createElement("tr");
        let posterCol = document.createElement("td");
        let poster = document.createElement("img");
        poster.src = element.poster;
        posterCol.appendChild(poster);

        let linkCol = makeTableLink(`/movies/${element.mid}`, element.title);
        row.append(posterCol, linkCol);
        moviesTable.appendChild(row);
    });
}

function updateFollowedUsers(){
    getFollowedUsers().then((users)=>{
        renderPeople(users, "usertable");
    }).catch((err)=>{
        alert(err);
    });
}

function updateFollowedPeople(){
    getFollowedPeople().then((people)=>{
        renderPeople(people, "peopletable");
    }).catch((err)=>{
        alert(err);
    });
}

function updateFollowers(){
    getFollowers().then((followers)=>{
        renderFollowers(followers);
    }).catch((err)=>{
        alert(err);
    });
}

function getFollowedPeople(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        xhttp.open("GET" ,`${window.location.href}/followedPeople`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function getFollowedUsers(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        xhttp.open("GET" ,`${window.location.href}/followedUsers`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function getFollowers(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        xhttp.open("GET" ,`${window.location.href}/followers`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function renderPeople(people, tableId){
    let peopleTable = document.getElementById(tableId);
    peopleTable.innerHTML="";
    peopleList = JSON.parse(people);
    peopleList.forEach((element)=>{
        let row = document.createElement("tr");
        let linkCol;
        if(tableId === "usertable"){
            linkCol = makeTableLink(`/users/${element.uid}`, element.username);
        }
        else{
            linkCol = makeTableLink(`/people/${element.pid}`, element.name);
        }
        row.appendChild(linkCol);
        
        peopleTable.appendChild(row);
    });
}

function renderFollowers(followers){
    let followerArr = JSON.parse(followers);
    let followerList = document.getElementById("follower-list");
    followerList.innerHTML = "";
    followerArr.forEach((follower)=>{
        let followerEntry = document.createElement("p");
        let followerLink = document.createElement("a");
        followerLink.href=`/users/${follower.uid}`;
        followerLink.innerText=`${follower.username}`;
        followerEntry.appendChild(followerLink);
        followerList.appendChild(followerEntry);
    });
}

function getReviews(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }
        xhttp.open("GET" ,`${window.location.href}/reviews`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function updateReviews(){
    getReviews().then((reviews) =>{
        renderReviews(reviews);
    }).catch((err) => {
        alert(err);
    })
}

function renderReviews(reviewsStr){
    reviews = JSON.parse(reviewsStr);
    let submittedReviews = document.getElementById("review-list");
    submittedReviews.innerHTML = "";
    reviews.forEach((reviewData) => {
        let review = document.createElement("div");
        review.classList.add("review");

        let source = document.createElement("h2");
        let sourceLabel = document.createTextNode("For: ");
        let sourceLink = document.createElement("a");
        sourceLink.href = `/movies/${reviewData.mid}`;
        sourceLink.innerText = reviewData.movieTitle;
        source.append(sourceLabel, sourceLink);

        let author = document.createElement("p");
        let authorLabel = document.createTextNode("By: ");
        let authorLink = document.createElement("a");
        authorLink.href = `/users/${reviewData.uid}`;
        authorLink.innerText = reviewData.username;
        author.append(authorLabel, authorLink);

        let score = document.createElement("span");
        score.classList.add("score");
        score.innerText = `${reviewData.score}`;

        let denom = document.createElement("span");
        denom.classList.add("score");
        denom.innerText = "/10";

        if(reviewData.type === "full"){
            let title = document.createElement("h3");
            title.classList.add("review-title");
            title.innerText = reviewData.title;
            let body = document.createElement("p");
            body.innerText = reviewData.body;
            review.append(source, title, author, score, denom, body);
        }
        else{
            review.append(source, author, score, denom);
        }
        submittedReviews.appendChild(review);
    });
}