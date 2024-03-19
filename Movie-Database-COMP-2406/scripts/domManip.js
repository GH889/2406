function makeTableLink(href, innerText){
    let linkCol = document.createElement("td");
    let link = document.createElement("a");
    link.href = href;
    link.innerText = innerText;
    linkCol.appendChild(link);
    return linkCol;
}