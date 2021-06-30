/*Class that handles the recieved messages from the server*/
function ClientMessagesManager(socket, serverClient){

    this.socket = socket;
    this.serverCli = serverClient;
    
    this.verbosity = false;

    this.printMessage = function(message){
        if(this.verbosity) console.log(message);
    }

    this.manageError = function(message){

        if(message.error){
            window.alert("Message error: " + message.error);
            return true;
        }
        return false;
    }

    this.roomAccessResponse = function(message){
        if(this.manageError(message)) return message;

        //hideJoinRoomPopup
        document.querySelector("#join_room_pu_fake_bg").style.display = "none";
        document.querySelector("#join_room_pu_area").style.setProperty('display', 'none', 'important');
        
        //hideInitPage
        document.querySelector("#init_page").style.display = "none";
        
        //showVenv
        document.querySelector("#venv_page").style.display = "";

        var friends_status_list = message.content.friends_status_list;
        var requests_list = message.content.requests_list;
        var friends_messages_lists = message.content.friends_messages_lists;

        friends_status_list.forEach(username_status => {
            friendsManager.addFriend(username_status.username, username_status.status);
        });

        requests_list.forEach(username => {
            friendsManager.addFriendRequest(username);
        });

        Object.entries(friends_messages_lists).forEach(([username, value]) => {
            if(value.content.json_msgs){
                value.content.json_msgs.forEach(message => {
                    if(message.username == username) friendsManager.recieveFriendMessage(message.text, message.username);
                    else friendsManager.showSentMessage(message.text, username);
                });
            }
        });

        if(localStorage.getItem("username") == message.content.room_data.room_info.owner){
            var accordion_chat = document.querySelector("#accordion_chat");
            var owner_settings = document.querySelector(".owner_settings");
            accordion_chat.appendChild(owner_settings);
        }

        initScene(message.content.room_data);
    }

    this.addConnectedUser = function(message){
        if(this.manageError(message)) return message;

        console.log("User connected: ", message.content.character.name);

        sceneObj.addCharacter(message.content.character);

    }

    this.removeDisconnectedUser = function(message){
        if(this.manageError(message)) return message;

        console.log("User disconnected: ", message.content.username);

        sceneObj.removeCharacter(message.content.username);
    }

    this.updateUserPosition = function(message){
        if(this.manageError(message)) return message;

        var username = message.content.username;
        var position = message.content.position;
        var rotation = message.content.rotation;

        sceneObj.updateCharacterPosition(username, position, rotation);
    }

    this.updateUserControls = function(message){
        if(this.manageError(message)) return message;

        var keyValue = Object.entries(message.content);
        var key = keyValue[1][0];
        var pressed = keyValue[1][1];
        var username = message.content.username;

        sceneObj.updateCharacterControls(username, key, pressed);
    }

    this.plotGlobalMessage = function(message){
        if(this.manageError(message)) return message;

        var username = message.content.username;
        var text = message.content.text;

        chatManager.recieveMessage(text, username);
    }

    this.reqResponse = function(message){
        if(this.manageError(message)) return message;
        window.alert(message.content.response);
    }

    this.recievedFriendReq = function(message){
        if(this.manageError(message)) return message;
        friendsManager.addFriendRequest(message.content.username);
    }

    this.addFriend = function(message){
        if(this.manageError(message)) return message;

        var username = message.content.username;
        var status = message.content.status;

        friendsManager.addFriend(username, status);
    }

    this.setUserStatusDisconnected = function(message){
        if(this.manageError(message)) return message;

        var username = message.content.username;

        friendsManager.setStatusDisconnected(username);
    }

    this.setUserStatusConnected = function(message){
        if(this.manageError(message)) return message;

        var username = message.content.username;

        friendsManager.setStatusConnected(username);
    }

    this.friendMessage = function(message){
        if(this.manageError(message)) return message;
        var username = message.content.username;
        var text = message.content.text;

        friendsManager.recieveFriendMessage(text, username);

    }

    this.changeRoomTexture = function(message){
        if(this.manageError(message)) return message;
        var texture_img_src = message.content.texture_img_src;

        sceneObj.objects.find(o => o.name == "room").textures.color = texture_img_src;
    }

    this.processMessage = function(message){
        var ct = message.content;
        switch(message.type){
            case "room_access":
                this.printMessage(this.roomAccessResponse(message));
                break;
            case "user_connected":
                this.printMessage(this.addConnectedUser(message));
                break;
            case "user_disconnected":
                this.printMessage(this.removeDisconnectedUser(message));
                break;
            case "position_update":
                this.printMessage(this.updateUserPosition(message));
                break;
            case "controls":
                this.printMessage(this.updateUserControls(message));
                break;
            case "gc_message":
                this.printMessage(this.plotGlobalMessage(message));
                break;
            case "fr_request_fb":
                this.printMessage(this.reqResponse(message));
                break;
            case "fr_request":
                this.printMessage(this.recievedFriendReq(message));
                break;
            case "reject_fr_request":
                this.printMessage(this.reqResponse(message));
                break;
            case "accept_fr_request":
                this.printMessage(this.reqResponse(message));
                break;
            case "add_friend":
                this.printMessage(this.addFriend(message));
                break;
            case "user_disconnected_bc":
                this.printMessage(this.setUserStatusDisconnected(message));
                break;
            case "user_connected_bc":
                this.printMessage(this.setUserStatusConnected(message));
                break;
            case "fc_message":
                this.printMessage(this.friendMessage(message));
                break;
            case "change_room_texture":
                this.printMessage(this.changeRoomTexture(message));
                break;
        }
    };
}