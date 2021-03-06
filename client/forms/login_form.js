/*Login form events*/
var main_page_div = document.querySelector("#main_page");
var login_page_div = document.querySelector("#login_page");

function goToMainPage(){

    console.log("Opening init page...");
    main_page_div.style.display = "";
    login_page_div.style.display = "none";
}

var login_form = document.querySelector("#login_form");

//Verify if there is already a token (user is logged).
var token = localStorage.getItem('token')
if(token){

    fetch("/node/9007/validateToken", {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: token
    }).then(handleErrors)
    .then(response=>response.text())
    .then(data=>{
        if(data == 'true'){
            goToMainPage();
        } else {
            console.log('There is not a token in the localStorage');
        }
    }).catch(err => window.alert("The server is closed."));

}

login_form.addEventListener('submit', function(event){
    event.preventDefault();

    var login_parameters = {};

    var input_elements = this.querySelectorAll("input");
    for(var i of input_elements){
        if(i.type != "submit"){
            login_parameters[i.name] = i.value;
        }
    }

    fetch("/node/9007/loginForm", {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(login_parameters)
    }).then(handleErrors)
    .then(response=>response.text())
    .then(data=>{ 
        if(data.split(':')[0] == 'Correct password'){
            localStorage.setItem('token', data.split(':')[1]);
            localStorage.setItem('username', data.split(':')[2]);
            goToMainPage();
        }else{
            window.alert(data);
            window.alert("The password is incorrect or the user does not exist.");
        }
    }).catch(err => window.alert("The server is closed."));
});