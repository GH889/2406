

function init(){
    document.getElementById("submitLogin").addEventListener('click', submitCredentials);
    document.getElementById("submitNewUser").addEventListener('click', submitNewUser);
}

function submitCredentials(){
    let loginObj ={
        username: document.getElementById("loginUser").value,
        password: document.getElementById("loginPass").value
    } 
    postUser(loginObj,false).then((id)=>{
        document.location = "/users/"+id;
    }).catch((err) => {
        alert(err);
    });
}

function submitNewUser(){
    let loginObj ={
        username: document.getElementById("loginUser").value,
        password: document.getElementById("loginPass").value
    } 
    postUser(loginObj,true).then(()=>{
        submitCredentials();
    }).catch((err) => {
        alert(err);
    });
}

function postUser(loginObj,newUser){
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

        if(newUser){xhttp.open("POST" ,`/users`);}
        else       {xhttp.open("POST" ,`/login`);}
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send(JSON.stringify(loginObj));
    });
}
