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
    updateWatchList();
    updateFollowedPeople();
    updateFollowedUsers();
    updateRecommended();
    updateReviews();
    updateNotifications();
    updateFollowers();
    document.getElementById("wipe-notifs").addEventListener('click', function(){
        wipeNotifications().then((response)=>{
            updateNotifications();
        }).catch((err)=>{
            alert(err);
        })
    })
}

function switchContributing(uid){
    userContributeAPI(uid, true).then((response)=>{
        alert(response);
        document.getElementById("switch-basic").classList.remove("restricted");
        document.getElementById("switch-contributing").classList.add("restricted");
        document.getElementById("add-movie").classList.remove("restricted");
        document.getElementById("add-person").classList.remove("restricted");
    }).catch((err)=>{
        alert(err);
    });
}

function switchBasic(uid){
    userContributeAPI(uid, false).then((response)=>{
        alert(response);
        document.getElementById("switch-basic").classList.add("restricted");
        document.getElementById("switch-contributing").classList.remove("restricted");
        document.getElementById("add-movie").classList.add("restricted");
        document.getElementById("add-person").classList.add("restricted");
    }).catch((err)=>{
        alert(err);
    });
}

function userContributeAPI(uid, wantsContributing){
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
        xhttp.open("PUT", `/users/${uid}`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        
        if(wantsContributing){
            xhttp.send(JSON.stringify({type: "contributing"}));
        }
        else{
            xhttp.send(JSON.stringify({type: "basic"}));
        }
    });
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
    getMovieList("watchlist").then((reco)=>{
        renderMovieList(reco, "watchtable");
    }).catch((err)=>{
        alert(err);
    });
}

function updateRecommended(){
    getMovieList("recommended").then((reco)=>{
        renderMovieList(reco, "recotable");
    }).catch((err)=>{
        alert(err);
    });
}

function getMovieList(type){
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
        if(type==="watchlist"){
            xhttp.open("GET" ,`${window.location.href}/watchlist`,true);
            xhttp.setRequestHeader('Accept', 'application/json');
            xhttp.send();
        }
        else if (type==="recommended"){
            xhttp.open("GET" ,`${window.location.href}/recommended`,true);
            xhttp.setRequestHeader('Accept', 'application/json');
            xhttp.send();
        }
        else{
            reject("That movie list doesn't exist.");
        }
    });
}

function removeMovie(mid){
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
        xhttp.open("DELETE", `${window.location.href}/watchlist/${mid}`);
        xhttp.send();
    });
}

function renderMovieList(movies, tableId){
    console.log(movies);
    let moviesTable = document.getElementById(tableId);
    moviesTable.innerHTML="";
    let moviesList = JSON.parse(movies);
    moviesList.forEach((movie)=>{
        let row = document.createElement("tr");
        let posterCol = document.createElement("td");
        posterCol.style.width = '50px';
        let poster = document.createElement("img");
        poster.src = movie.poster;
        posterCol.appendChild(poster);

        let linkCol = makeTableLink("/movies/" + movie.mid, movie.title);
        linkCol.classList.add("movie-title");
        row.append(posterCol, linkCol);
        
        if(tableId === "watchtable"){
            let btnCol = document.createElement("td");
            let btn = document.createElement("button");
            btn.innerText = "Remove";
            btn.classList.add("btn-style", "dark-bg", "dark-bg-text", "remove-btn");
            btn.addEventListener('click', function(){
                removeMovie(movie.mid)
                    .then((response)=>{
                        alert(response);
                        updateWatchList();
                    })
                    .catch((err)=>{
                        alert(err);
                    });
            })
            btnCol.appendChild(btn);
            row.appendChild(btnCol);
        }
        
        moviesTable.appendChild(row);
    });
}

function unfollow(id, isPerson){
    return new Promise((resolve, reject)=>{
        if(isPerson){
            //Owen's responsibility
        }
        else{
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function(){
                if(this.readyState === 4 && this.status === 200){
                    resolve(this.response);
                }
                else if(this.readyState === 4){
                    reject(this.response);
                }
            }
            let uid = getUserId();
            xhttp.open("DELETE", `/users/${id}/followers/${uid}`);
            xhttp.send();
        }
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
    let peopleList = JSON.parse(people);
    peopleList.forEach((person)=>{
        let row = document.createElement("tr");
        let linkCol;
        if(tableId === "usertable"){
            linkCol = makeTableLink(`/users/${person.uid}`, person.username);
        }
        else{
            linkCol = makeTableLink(`/people/${person.pid}`, person.name);
        }
        row.appendChild(linkCol);
        
        let removeCol = document.createElement("td");
        let btn = document.createElement("button");
        btn.classList.add("btn-style", "dark-bg", "dark-bg-text", "remove-btn");
        btn.innerText = "Unfollow";
        if(tableId === "usertable"){
            btn.addEventListener('click', function(){
                unfollow(person.uid, false)
                    .then(updateFollowedUsers)
                    .catch((err)=>{
                        alert(err);
                    });
            });
            removeCol.appendChild(btn);
        }
        else{
            btn.addEventListener('click', function(){
                unfollow(person.pid, true)
                    .then(updateFollowedPeople)
                    .catch((err)=>{
                        alert(err);
                    });
            });
        }
        removeCol.appendChild(btn);
        row.appendChild(removeCol);
        
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
    let reviews = JSON.parse(reviewsStr);
    let submittedReviews = document.getElementById("review-list");
    submittedReviews.innerHTML = "";
    reviews.forEach((reviewData) => {
        let review = document.createElement("div");
        review.classList.add("review");

        let source = document.createElement("h2");
        let sourceLabel = document.createTextNode("For: ");
        let sourceLink = document.createElement("a");
        sourceLink.href = "/movies/" + reviewData.mid;
        sourceLink.innerText = reviewData.movieTitle;
        source.append(sourceLabel, sourceLink);

        let author = document.createElement("p");
        let authorLabel = document.createTextNode("By: ");
        let authorLink = document.createElement("a");
        authorLink.href = `${window.location.href}`;
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

function getNotifs(){
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
        xhttp.open("GET" ,`${window.location.href}/notifications`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function updateNotifications(){
    getNotifs().then((notifications)=>{
        renderNotifications(notifications);
    }).catch((err)=>{
        alert(err);
    });
}

function renderNotifications(notificationsStr){
    let notifications = JSON.parse(notificationsStr);
    notifications = notifications.reverse();
    let notifList = document.getElementById("notif-list");
    notifList.innerHTML = "";
    notifications.forEach((notif) => {
        let notifLink = document.createElement("a");
        notifLink.href = notif.link;
        let notification = document.createElement("div");
        notification.classList.add("notif");
        let notifText = document.createElement("p");
        if(notif.subject === "person"){
            notifText.innerText = `${notif.subjectName} just contributed to a new movie!`;
        }
        else if(notif.subject === "review"){
            notifText.innerText = `${notif.subjectName} just made a new review!`;
        }
        else{
            notifText.innerText = `${notif.subjectName} just followed you!`;
        }
        notification.appendChild(notifText);
        notifLink.appendChild(notification);
        notifList.appendChild(notifLink);
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

function wipeNotifications(){
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
        xhttp.open("DELETE" ,`${window.location.href}/notifications`,true);
        xhttp.send();
    });
}