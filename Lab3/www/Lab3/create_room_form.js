var create_room_form = document.querySelector("#create_room_form");

var create_room_private = document.querySelector("#create_room_private");
var create_room_scode = document.querySelector("#create_room_scode");
var create_room_scode_label = document.querySelector("#create_room_scode_label");

var create_room_name = document.querySelector("#create_room_name");

create_room_form.addEventListener("submit", function(event){
    event.preventDefault();

    console.log("form sended");

    //Email validation.
    fetch("/node/9007/createRoom", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"), 
            room_name: create_room_name.value, 
            secret_code: create_room_private.checked ? create_room_scode.value : ""
        })
    }).then(handleErrors)
    .then(response=>response.json())
    .then(data=>{
        console.log(data); 
        if(data.error){ //Email send successful.
            window.alert(data.error);
            return;
        }
        console.log("OK");
        //Open canvas page with the room.
    }).catch(err => window.alert("The server is closed."));
});

create_room_private.addEventListener( 'change', function() {
    if(this.checked) {
        //Public.
        create_room_scode.required = "true";
        create_room_scode.style.display = "";
        create_room_scode_label.style.display = "";
    } else {
        //Private.
        create_room_scode.required = "false";
        create_room_scode.style.display = "none";
        create_room_scode_label.style.display = "none";
    }
});