let actors    = [];
let writers   = [];
let directors = [];
let keywords  = [];
let allNames  = [];

function init(){
    document.getElementById("submitMovie").addEventListener('click', addMovie);
    document.getElementById("AddStaff"   ).addEventListener('click', addStaff);
    getAllPeople();
}

function clean(){
    actors    = [];
    writers   = [];
    directors = [];
    keywords  = [];
    document.getElementById("month"     ).value="";
    document.getElementById("day"       ).value="";
    document.getElementById("runtime"   ).value="";
    document.getElementById("rating"    ).value="";
    document.getElementById("poster"    ).value="";
    document.getElementById("movieTitle").value="";
    document.getElementById("year"      ).value="";
    document.getElementById("plot"      ).value="";
    clearStaff();
    updateLists();
}

function addMovie(){
    let mov = makeMovie();
    if(validateMovie(mov)){
        postMovie(mov).then(()=>{
            alert("Movie Added");
            clean();
        }).catch((err) => {
            alert(err);
        });
    }
}

function addStaff(){
    let a = document.getElementById("actor"   ).value;
    let w = document.getElementById("writer"  ).value;
    let d = document.getElementById("director").value;
    let k = document.getElementById("genre"   ).value;
    if(a > ""){   actors.push(a);}
    if(w > ""){  writers.push(w);}
    if(d > ""){directors.push(d);}        
    if(k > ""){ keywords.push(k);}
    updateLists();
    clearStaff();
}

function updateLists(){
    document.getElementById("actorList"   ).innerHTML = "["+actors   +"]";
    document.getElementById("writerList"  ).innerHTML = "["+writers  +"]";
    document.getElementById("directorList").innerHTML = "["+directors+"]";
    document.getElementById("genreList"   ).innerHTML = "["+keywords +"]";
}

function clearStaff(){
    document.getElementById("actor"   ).value = "";
    document.getElementById("writer"  ).value = "";
    document.getElementById("director").value = "";
    document.getElementById("genre"   ).value = "";
}

function postMovie(movieObj){
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

        xhttp.open("POST" ,`/movies`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send(JSON.stringify(movieObj));
    });
}

function makeMovie(){
    let movieObj = {
        releaseMonth: document.getElementById("month"     ).value,
        releaseDay  : document.getElementById("day"       ).value,
        runtime     : document.getElementById("runtime"   ).value,
        rating      : document.getElementById("rating"    ).value,
        poster      : document.getElementById("poster"    ).value,
        title       : document.getElementById("movieTitle").value,
        year        : document.getElementById("year"      ).value,
        plot        : document.getElementById("plot"      ).value,
        genre       : keywords,//document.getElementById("genre"     ).value,
        actors      : actors,
        writer      : writers,
        director    : directors
    };
    return movieObj;
}

function validateMovie(movieObj){
    let month = document.getElementById("month"     ).value;
    if(month<1 || month>12) {alert("month out of bound");return false;}
    if(!valiDate(parseInt(document.getElementById("day").value),parseInt(month),parseInt(document.getElementById("year").value))){return false};

    if(movieObj.genre.length===0)   {alert("Add at least one genre"   );return false;}
    if(movieObj.actors.length===0)  {alert("Add at least one Actor"   );return false;}
    if(movieObj.writer.length===0)  {alert("Add at least one Writer"  );return false;}
    if(document.getElementById("runtime"   ).value==="") {alert("Fill in Runtime"    );return false;}
    if(document.getElementById("rating"    ).value==="") {alert("Fill in rating"     );return false;}
    if(document.getElementById("poster"    ).value==="") {alert("Fill in poster link");return false;}
    if(document.getElementById("movieTitle").value==="") {alert("Fill in title"      );return false;}
    if(document.getElementById("plot"      ).value==="") {alert("Fill in polt"       );return false;}
    if(document.getElementById("year"      ).value==="") {alert("Fill in year"       );return false;}
    return true;
}

function valiDate(d,m,y){
    switch(m){
        case 2 : if(d<1 || d > (((y%400===0) || (y%100===0&&!(y%4===0)))? 29 : 28)){alert("Date out of bounds");return false;}else{return true;}
        case 1 :
        case 3 :
        case 5 :
        case 7 :
        case 8 :
        case 10:
        case 12:if(d<1 || d > 31){alert("Date out of bounds");return false;}else{return true;}
        case 4 :
        case 6 :
        case 9 :
        case 11:if(d<1 || d > 30){alert("Date out of bounds");return false;}else{return true;}
    }
}

function initDropDown(){
    let nameDropDown = document.getElementById("names")
    nameDropDown.innerHTML="";
    allNames.forEach(name=>{
        let addName = document.createElement("option");
        addName.value = name;
        nameDropDown.appendChild(addName);
    });
}

function getAllPeople(){
    getPeople().then((peopleJSON) =>{
        JSON.parse(peopleJSON).forEach(name => {
            allNames.push(name);
        });
        initDropDown();
    }).catch((err) => {
        console.log(err);
    });
}

function getPeople(){
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

        xhttp.open("GET" ,`/people`,true);
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send();
    });
}