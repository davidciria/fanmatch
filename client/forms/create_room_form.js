/*Create room form events */
var create_room_form = document.querySelector("#create_room_form");

function validateRoomField(field){
    var re = /^[0-9a-zA-Z]{5,20}$/;
    return re.test(String(field));
}

var create_room_name = document.querySelector("#create_room_name"); //Input room name.
invalid_roomname_msg = "Invalid username: Username can contain alphanumeric characters. Number of characters must be between 5 to 20."
create_room_name.addEventListener('invalid', function(){ this.setCustomValidity(invalid_roomname_msg); });
create_room_name.addEventListener('input', function(){ this.setCustomValidity(""); });
create_room_name.addEventListener('change', function(){ validateField(validateRoomField, this) });
create_room_name.addEventListener('keyup', function(){ validateField(validateRoomField, this) });

var create_room_private = document.querySelector("#create_room_private"); //Input checkbox.

//Secret code input.
var create_room_scode = document.querySelector("#create_room_scode");
var create_room_scode_label = document.querySelector("#create_room_scode_label");
invalid_roomscode_msg = "Invalid secret code: Secret code can contain alphanumeric characters. Number of characters must be between 5 to 20."
create_room_scode.addEventListener('invalid', function(){ this.setCustomValidity(invalid_roomscode_msg); });
create_room_scode.addEventListener('input', function(){ this.setCustomValidity(""); });
create_room_scode.addEventListener('change', function(){ validateField(validateRoomField, this) });
create_room_scode.addEventListener('keyup', function(){ validateField(validateRoomField, this) });

create_room_form.addEventListener("submit", function(event){
    event.preventDefault();

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
        if(data.error){ //Email send successful.
            window.alert(data.error);
            return;
        }
        
        if(create_room_private.checked) startRoomConnection(create_room_name.value, create_room_scode.value);
        else startRoomConnection(create_room_name.value, "");
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