/*Join room form events */
var join_room_form = document.querySelector("#join_room_form");
var join_room_name = document.querySelector("#join_room_name");

var join_room_pu_fake_bg = document.querySelector("#join_room_pu_fake_bg");
var join_room_pu_area = document.querySelector("#join_room_pu_area");
var join_room_pu_form = document.querySelector("#join_room_pu_form");
var join_room_pu_scode = document.querySelector("#join_room_pu_scode");
var join_room_pu_area_title = document.querySelector("#join_room_pu_area_title");

var init_page = document.querySelector("#init_page");
var venv_page = document.querySelector("#venv_page");

function showJoinRoomPopup(room_name){
    join_room_pu_area_title.innerText = "Room: " + room_name;
    join_room_pu_fake_bg.style.display = "";
    join_room_pu_area.style.display = "";
}

function hideJoinRoomPopup(){
    join_room_pu_fake_bg.style.display = "none";
    join_room_pu_area.style.setProperty('display', 'none', 'important');
}

function hideInitPage(){
    init_page.style.display = "none";
}

function showVenv(){
    venv_page.style.display = "";
}

function startRoomConnection(room_name, secret_code){
    localStorage.setItem("room_name", room_name); //Store room_name where we have joined.
    document.querySelector("#gc_room_name").innerText = "Room: " + localStorage.getItem("room_name");
    serverClient.connect("wss://ecv-etic.upf.edu/node/9007/ws/", room_name, secret_code, localStorage.getItem("token"));
}

function joinRoom(event){
    if(event) event.preventDefault();

    fetch("/node/9007/joinRoom", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"), 
            room_name: join_room_name.value
        })
    }).then(handleErrors)
    .then(response=>response.json())
    .then(data=>{
        
        if(data.error){ //Email send successful.
            window.alert(data.error);
            return;
        }
        
        if(data.private){
            //Show secret code popup.
            showJoinRoomPopup(join_room_name.value);
            return;
        }

        startRoomConnection(join_room_name.value, "");
        
    }).catch(err => window.alert("The server is closed."));
}

if(localStorage.getItem("friendRoomName")){
    join_room_name.value = localStorage.getItem("friendRoomName");
    localStorage.removeItem("friendRoomName");
    joinRoom();
}

join_room_form.addEventListener("submit", joinRoom);

join_room_pu_fake_bg.addEventListener("click", hideJoinRoomPopup);

join_room_pu_form.addEventListener("submit", function(event){
    event.preventDefault();

    fetch("/node/9007/joinRoomWithCode", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"), 
            room_name: join_room_name.value,
            secret_code: join_room_pu_scode.value
        })
    }).then(handleErrors)
    .then(response=>response.json())
    .then(data=>{
        
        if(data.error){ //Email send successful.
            window.alert(data.error);
            return;
        }

        startRoomConnection(join_room_name.value, join_room_pu_scode.value);
        
    }).catch(err => window.alert(err));
});