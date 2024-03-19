let reviews = [];
let recommended = [];

function init(){
    setupReview();
    setupAddWatched();
    updateReviews();
    updateRecommended();
    document.getElementById("more-reviews").addEventListener("click", updateReviews);
}

function setupReview(){
    let slider = document.getElementById("score");
    let output = document.getElementById("user-score");
    output.innerText = slider.value;

    slider.oninput = function(){
        output.innerText = this.value;
    }
    setupModeSwap();
    setupSubmit();
}


function setupModeSwap(){
    document.getElementById("full-review-btn").addEventListener('click', function(){
        document.getElementById("full-review").style.display="block";
        document.getElementById("basic-review-btn").style.display="inline";
        document.getElementById("review-type").value = "full";
        this.style.display="none";
    });
    document.getElementById("basic-review-btn").addEventListener('click', function(){
        document.getElementById("full-review").style.display="none";
        document.getElementById("full-review-btn").style.display="inline";
        document.getElementById("review-type").value = "basic";
        this.style.display="none";
    });
}

function setupSubmit(){
    document.getElementById("submit-review-btn").addEventListener('click', submitReview);
}

function submitReview(){
    let reviewScore = document.getElementById("score").value;
    let reviewType = document.getElementById("review-type").value;
    let reviewTitle = document.getElementById("review-title").value;
    let reviewBody = document.getElementById("review-body").value;
    let reviewObj = {
        score : reviewScore,
        type : reviewType,
        title : reviewTitle,
        body : reviewBody
    };
    postReview(reviewObj).then(()=>{
        updateReviews();
    }).catch((err) => {
        alert(err);
    });
}

function postReview(reviewObj){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 201){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("POST" ,`${window.location.href}/reviews`,true);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send(JSON.stringify(reviewObj));
    });
}

function updateReviews(){
    getReviews().then((reviews) =>{
        updateReviewAvg();
        renderReviews(reviews);
    }).catch((err) => {
        alert(err);
    })
}

function getReviews(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
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

function updateReviewAvg(){
    getReviewAvg().then((scoreObj)=>{
        let ratingSection = document.getElementById("review-overview");
        let score = JSON.parse(scoreObj).score;
        if(score === 0){
            ratingSection.innerText = "Unreviewed";
        }
        else{
            ratingSection.innerText = `${score.toFixed(1)}/10`;
        }
    }).catch(()=>{
        alert("Something went wrong grabbing the average review score . . . ");
    })
}

function getReviewAvg(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET" ,`${window.location.href}/score`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function renderReviews(reviewsStr){
    reviews = JSON.parse(reviewsStr);
    let submittedReviews = document.getElementById("submitted-reviews");
    submittedReviews.innerHTML = "";
    reviews.forEach((element) => {
        let review = document.createElement("div");
        review.classList.add("review");

        let author = document.createElement("p");
        let authorLabel = document.createTextNode("By: ");
        let authorLink = document.createElement("a");
        authorLink.href = `/users/${element.uid}`;
        authorLink.innerText = element.username;
        author.append(authorLabel, authorLink);

        let score = document.createElement("span");
        score.classList.add("score");
        score.innerText = `${element.score}`;

        let denom = document.createElement("span");
        denom.classList.add("score");
        denom.innerText = "/10";

        if(element.type === "full"){
            let title = document.createElement("h3");
            title.classList.add("review-title");
            title.innerText = element.title;
            let body = document.createElement("p");
            body.innerText = element.body;
            review.append(title, author, score, denom, body);
        }
        else{
            review.append(author, score, denom);
        }
        submittedReviews.appendChild(review);
    });
}

function updateRecommended(){
    getRecommended().then((reco)=>{
        renderRecommended(reco);
    }).catch((err)=>{
        alert(err);
    })
}

function getRecommended(){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET" ,`${window.location.href}/recommendations`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}

function renderRecommended(recommended){
    let recommendedTable = document.getElementById("recommended");
    recommendedTable.innerHTML="";
    recommendedList = JSON.parse(recommended);
    recommendedList.forEach((element)=>{
        let row = document.createElement("tr");
        let posterCol = document.createElement("td");
        let poster = document.createElement("img");
        poster.src = element.poster;
        poster.alt = element.title;
        
        let linkCol = document.createElement("td");
        let link = document.createElement("a");
        link.href = "/movies/" + element.mid;
        link.innerText = element.title;
        
        posterCol.appendChild(poster);
        linkCol.appendChild(link);
        row.append(posterCol, linkCol);
        recommendedTable.appendChild(row);
    });
}

function setupAddWatched(){
    try{
        document.getElementById("add-watched").addEventListener('click', function(){
            modifyWatchList(true).then((response)=>{
                document.getElementById("remove-watched").classList.remove("restricted");
                document.getElementById("add-watched").classList.add("restricted");
            })
            .catch((err)=>{
                alert(err);
            });
        });
        document.getElementById("remove-watched").addEventListener('click', function(){
            modifyWatchList(false).then((response)=>{
                document.getElementById("remove-watched").classList.add("restricted");
                document.getElementById("add-watched").classList.remove("restricted");
            })
            .catch((err)=>{
                alert(err);
            });
        });
    }
    catch(err){

    }
}

function modifyWatchList(isAdding){
    return new Promise((resolve, reject)=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
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
        if(isAdding){
            xhttp.open("PUT", `/users/${uid}/watchlist`);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.send(JSON.stringify({mid: getMovieId()}));
        }
        else{
            xhttp.open("DELETE", `/users/${uid}/watchlist/${getMovieId()}`);
            xhttp.send();
        }
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

function getMovieId(){
    return window.location.href.split('/').pop();
}