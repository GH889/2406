
function init(){
    if( document.getElementById("follow").innerHTML === "follow"){
        document.getElementById("follow").addEventListener('click', follow);
        document.getElementById("follow").innerHTML = "FOLLOW";
    }else{
        document.getElementById("follow").addEventListener('click', unfollow);
        document.getElementById("follow").innerHTML = "UNFOLLOW";
    }
    updateCollaberators();
    updateActedMovies();
    updateDirectedMovies();
    updateWrittenMovies();
}

function unfollow(){
    postFollow(false).then((result)=>{
        alert(result);
        document.getElementById("follow").removeEventListener('click', unfollow)
        document.getElementById("follow").addEventListener('click', follow);
        document.getElementById("follow").innerHTML = "FOLLOW";
    }).catch((err) => {
        alert(err);
        console.log("err");
    });
}

function follow(){
    postFollow(true).then((result)=>{
        alert(result);
        document.getElementById("follow").removeEventListener('click', follow)
        document.getElementById("follow").addEventListener('click', unfollow);
        document.getElementById("follow").innerHTML = "UNFOLLOW";
    }).catch((err) => {
        alert(err);
    });
}
function renderCollaberators(cList){
    let collabList = document.getElementById("colabPeople");
    cList.forEach(person => {
        let ele = document.createElement("li");
        let link = document.createElement("a");
        link.innerHTML = person.name;
        link.href = "/people/" + person.pid;
        ele.appendChild(link);
        collabList.appendChild(ele);
    });
}
function renderMoviesList(mList,sectionId){
    let actedList = document.getElementById(sectionId);
    mList.forEach(movie => {
        let row = document.createElement("tr");
        let posterCol = document.createElement("td");
        let poster = document.createElement("img");
        poster.src = movie.poster;
        posterCol.appendChild(poster);

        let linkCol = document.createElement("a");
        linkCol.innerHTML = movie.title;
        linkCol.href = "/movies/"+movie.mid;
        row.append(posterCol, linkCol);
        actedList.appendChild(row);
    });
}

function updateCollaberators(){    
    getCollaberators().then((result)=>{
        renderCollaberators(JSON.parse(result));
    }).catch((err) => {
        console.log(err);
    });
}
function updateActedMovies(){    
    getActedMovies().then((result)=>{
        renderMoviesList(JSON.parse(result),"acted");
    }).catch((err) => {
        console.log(err);
    });}
function updateWrittenMovies(){    
    getWrittenMovies().then((result)=>{
        renderMoviesList(JSON.parse(result),"wrote");
    }).catch((err) => {
        console.log(err);
    });}
function updateDirectedMovies(){    
    getDirectedMovies().then((result)=>{
        renderMoviesList(JSON.parse(result),"directed");
    }).catch((err) => {
        console.log(err);
    });}



function postFollow(bool){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        if(bool){xhttp.open("POST"  ,`${window.location.href}/followers`);}
        else    {xhttp.open("Delete",`${window.location.href}/followers`);}
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}
function getCollaberators(){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET",`${window.location.href}/collaborators`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}
function getActedMovies(){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET",`${window.location.href}/acted`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}
function getWrittenMovies(){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET",`${window.location.href}/wrote`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}
function getDirectedMovies(){
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200){
                resolve(this.response);
            }
            else if(this.readyState === 4){
                reject(this.response);
            }
        }

        xhttp.open("GET",`${window.location.href}/directed`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}