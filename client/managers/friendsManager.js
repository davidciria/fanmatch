/*Class that manages friends events (send request, accept or reject...)*/
var af_button = document.querySelector("#af_button");
var af_input = document.querySelector("#af_input");
var fr_req_template = document.querySelector(".fr_req");
var fr_area = document.querySelector("#fr_area");

var fc_friend_template = document.querySelector(".fc_friend");
var fc_area = document.querySelector("#fc_area");

var fc_msgs_area = document.querySelector("#fc_msgs_area");

var fc_msg_area_template = document.querySelector(".fc_msg_area");
var fc_input_area = document.querySelector("#fc_input_area");
var fc_input = document.querySelector("#fc_input");
var fc_button = document.querySelector("#fc_button");

var target_fc_area;

var my_msg_tmp = document.querySelector(".my_msg");
var th_msg_tmp = document.querySelector(".th_msg");

function FriendsManager(){
    this.sendFriendRequest = function(){
        var username = af_input.value;
        af_input.value = "";
        if(username != localStorage.getItem("username")) serverClient.sendFriendRequest(username);
        else window.alert("You cannot send a friend request to yourself");
    }

    this.acceptFriendReq = function(username, element){
        serverClient.acceptFriendReq(username);
        element.remove();
    }

    this.rejectFriendReq = function(username, element){
        serverClient.rejectFriendReq(username);
        element.remove();
    }

    this.openFriendChat = function(username){
        var friends_list = document.querySelectorAll(".fc_friend");
        friends_list.forEach(e => {
            e.style.display = "none";
        });
        var fc_friend = document.querySelector("#friend_" + username);
        target_fc_area = document.querySelector("#friend_chat_" + username);

        var fc_chat = fc_friend.querySelector(".fc_chat");
        var fc_back = fc_friend.querySelector(".fc_back");

        fc_friend.style.display = "";
        target_fc_area.style.display = "";
        fc_input_area.style.display = "";
        fc_back.style.display = "";
        fc_chat.style.display = "none";
        target_fc_area.scrollTop = 10000;
    }

    this.closeFriendChat = function(username){
        var friends_list = document.querySelectorAll(".fc_friend");
        friends_list.forEach(e => {
            if(e.id) e.style.display = "";
        });
        var fc_friend = document.querySelector("#friend_" + username);
        target_fc_area = document.querySelector("#friend_chat_" + username);

        var fc_chat = fc_friend.querySelector(".fc_chat");
        var fc_back = fc_friend.querySelector(".fc_back");

        target_fc_area.style.display = "none";
        fc_input_area.style.display = "none";
        fc_back.style.display = "none";
        fc_chat.style.display = "";
    }

    this.addFriendRequest = function(username){
        var fr_req = fr_req_template.cloneNode(true);
        fr_req.style.display = "";
        var fr_username = fr_req.querySelector(".fr_username");
        fr_username.innerText = username;

        var fr_accept = fr_req.querySelector(".fr_accept");
        var fr_reject = fr_req.querySelector(".fr_reject");

        var that = this;

        fr_accept.addEventListener("click", function(){ that.acceptFriendReq(username, fr_req) });
        fr_reject.addEventListener("click", function(){ that.rejectFriendReq(username, fr_req) });

        fr_area.appendChild(fr_req);
    }

    this.joinFriendRoom = function(username){

        if(sceneObj.characters[username]) return window.alert("You are already in the same room");

        fetch("/node/9007/userRoom", {
            method: "POST", 
            headers: {
                'Content-Type': 'text/html',
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"), 
                username: username
            })
        }).then(handleErrors)
        .then(response=>response.json())
        .then(data=>{
            
            if(data.error){ //Email send successful.
                window.alert(data.error);
                return;
            }

            var friend_room_name = data.room_name;
    
            localStorage.setItem("friendRoomName", friend_room_name);

            window.location.reload();
            
        }).catch(err => window.alert("The server is closed."));
    }

    this.addFriend = function(username, status){
        var fc_friend = fc_friend_template.cloneNode(true);
        fc_friend.style.display = "";
        fc_friend.id = "friend_" + username;
        var fc_username = fc_friend.querySelector(".fc_username");
        fc_username.innerText = username;

        var fc_status_conn = fc_friend.querySelector(".fc_status_conn");
        var fc_status_disc = fc_friend.querySelector(".fc_status_disc");
        var fc_chat = fc_friend.querySelector(".fc_chat");
        var fc_join = fc_friend.querySelector(".fc_join");
        var fc_back = fc_friend.querySelector(".fc_back");

        if(!status){
            fc_status_conn.style.display = "none";
            fc_status_disc.style.display = "";
            fc_join.style.display = "none";
        }

        var that = this;

        fc_chat.addEventListener("click", function(){ that.openFriendChat(username) });
        fc_back.addEventListener("click", function(){ that.closeFriendChat(username) });
        fc_join.addEventListener("click", function(){ that.joinFriendRoom(username) }); //HERE.

        fc_area.appendChild(fc_friend);

        var fc_msg_area = fc_msg_area_template.cloneNode(true);
        fc_msg_area.id = "friend_chat_" + username;

        fc_msgs_area.appendChild(fc_msg_area);
    }

    this.setStatusDisconnected = function(username){
        var fc_friend_username = document.querySelector("#friend_" + username);

        var fc_status_conn = fc_friend_username.querySelector(".fc_status_conn");
        var fc_status_disc = fc_friend_username.querySelector(".fc_status_disc");
        var fc_join = fc_friend_username.querySelector(".fc_join");

        fc_status_conn.style.display = "none";
        fc_status_disc.style.display = "";
        fc_join.style.display = "none";
    }

    this.setStatusConnected = function(username){
        var fc_friend_username = document.querySelector("#friend_" + username);

        var fc_status_conn = fc_friend_username.querySelector(".fc_status_conn");
        var fc_status_disc = fc_friend_username.querySelector(".fc_status_disc");
        var fc_join = fc_friend_username.querySelector(".fc_join");

        fc_status_conn.style.display = "";
        fc_status_disc.style.display = "none";
        fc_join.style.display = "";
    }

    this.showSentMessage = function(text, username){
        var text = text;
        var my_msg = my_msg_tmp.cloneNode(true);
        my_msg.style.display = "";
        var my_txt = my_msg.querySelector(".my_txt");
        my_txt.innerText = text;
        var friend_chat = document.querySelector("#friend_chat_"+username);
        friend_chat.appendChild(my_msg);
        friend_chat.scrollTop = 1000;
    }

    this.sendFriendMessage = function(){
        var text = fc_input.value;
        fc_input.value = "";
        var my_msg = my_msg_tmp.cloneNode(true);
        my_msg.style.display = "";
        var my_txt = my_msg.querySelector(".my_txt");
        my_txt.innerText = text;
        target_fc_area.appendChild(my_msg);
        target_fc_area.scrollTop = 1000;

        var dest_username = target_fc_area.id.substring(12);

        serverClient.sendFriendMessage(text, dest_username);
    };

    this.recieveFriendMessage = function(text, username){
        var th_msg = th_msg_tmp.cloneNode(true);
        th_msg.style.display = "";
        var th_txt = th_msg.querySelector(".th_txt");
        th_txt.innerText = text;
        var th_username = th_msg.querySelector(".th_username");
        th_username.remove();

        var friend_chat = document.querySelector("#friend_chat_"+username);
        friend_chat.appendChild(th_msg);
        friend_chat.scrollTop = 1000;
    }

}

var friendsManager = new FriendsManager();

af_button.addEventListener("click", friendsManager.sendFriendRequest);
af_input.addEventListener("keypress", function(e){
    if(e.key === 'Enter') friendsManager.sendFriendRequest();
});

fc_button.addEventListener("click", friendsManager.sendFriendMessage);
fc_input.addEventListener("keypress", function(e){
    if(e.key === 'Enter') friendsManager.sendFriendMessage();
});