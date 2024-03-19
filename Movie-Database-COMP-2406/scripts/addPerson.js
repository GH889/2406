let allNames = [];

function init(){
    document.getElementById("AddPersonButton").addEventListener('click', addPerson);
}

function addPerson(){
    postPerson(document.getElementById("addPerson").value).then(()=>{
        alert("added New Person");
        document.getElementById("addPerson").value = "";
    }).catch((err) => {
        alert(err);
    });
}

function postPerson(newPerson){
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

        xhttp.open("POST",`/people`);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader('Accept', 'application/json');
        xhttp.send(JSON.stringify({name:newPerson}));
    });
}