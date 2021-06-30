function MessagesManager(CORE){

    this.CORE = CORE;
    
    this.verbosity = false;

    this.printMessage = function(message){
        if(this.verbosity) console.log(message);
    }

    this.validateRoomAccess = async function(connection, ct){

        var room_name = ct.room_name;
        var secret_code = ct.secret_code;
        var token = ct.token;

        var payload = await this.CORE.tokenManager.validateToken(token);
        if(!payload){
            var message = {
                type: "room_access",
                error: "Invalid token"
            };
            connection.sendUTF(JSON.stringify(message));
            return message;
        }

        var response = await this.CORE.DB.getRoomData(room_name, secret_code);

        if(response.error){
            var message = {
                type: "room_access",
                error: response.error
            };
            connection.sendUTF(JSON.stringify(message));
            return message;
        }

        //Save email and username.
        connection.email = payload.email;
        connection.username = payload.username;
        connection.room_name = room_name;

        //Save connection of each user
        this.CORE.username_connection[payload.username] = connection;

        //Add user to roomsManager.
        var init_state = this.CORE.roomsManager.newUser(connection, response.content.room_data);

        var friends_data = await this.CORE.DB.getFriendsData(payload.email);

        var friends_status_list = [];
        var friends_messages_lists = {};
        var that = this;
        friends_data.fr_list.forEach(function(u){
            var s = that.CORE.username_connection[u] ? true : false;
            friends_status_list.push({username: u, status: s});
        });

        for (const u of friends_data.fr_list) {
            friends_messages_lists[u] = await that.CORE.DB.retrieveMessages(payload.username, u);
        }

        var message = {
            type: "room_access",
            content: {
                room_data: init_state,
                friends_status_list: friends_status_list,
                requests_list: friends_data.req_list,
                friends_messages_lists: friends_messages_lists
            }
        };

        connection.sendUTF(JSON.stringify(message));

        friends_data.fr_list.forEach(u => {
            //Inform other users that user has connected.
            var message = {
                type: "user_connected_bc",
                content: {
                    username: payload.username
                }
            }
            if(this.CORE.username_connection[u]) this.CORE.username_connection[u].sendUTF(JSON.stringify(message));
        });

        return message;
    }

    this.updateUserPosition = function(connection, ct){
        var username = connection.username;
        var room_name = connection.room_name;
        var position = ct.position;
        var rotation = ct.rotation;

        this.CORE.roomsManager.updateUserPosition(username, room_name, position, rotation);
    }

    this.takeUserControls = function(connection, ct){
        var username = connection.username;
        var room_name = connection.room_name;

        var keyValue = Object.entries(ct);
        var key = keyValue[0][0];
        var pressed = keyValue[0][1];

        this.CORE.roomsManager.updateUserControls(username, room_name, key, pressed);
    }

    this.globalMessage = function(connection, ct){
        var username = connection.username;
        var room_name = connection.room_name;
        var text = ct.text;

        this.CORE.roomsManager.globalMessage(username, room_name, text);
    }

    this.friendRequest = async function(connection, ct){
        var username = connection.username;
        var email = connection.email;
        var dest_username = ct.username; //Friend that will recieve the request.

        var message = await this.CORE.DB.saveFriendRequest(username, email, dest_username);

        message.type = "fr_request_fb";

        connection.sendUTF(JSON.stringify(message));

        if(!message.error){
            var message = {
                type: "fr_request",
                content: {
                    username: username
                }
            }

            this.CORE.username_connection[dest_username].sendUTF(JSON.stringify(message));
        }
    }

    this.acceptFriendReq = async function(connection, ct){
        var username = connection.username;
        var email = connection.email;
        var accepted_username = ct.username;

        var message = await this.CORE.DB.acceptFriendReq(username, email, accepted_username);

        message.type = "accept_fr_request";

        connection.sendUTF(JSON.stringify(message));

        var message = {
            type: "add_friend",
            content: {
                status: true,
                username: username
            }
        }

        try{
            await this.CORE.username_connection[accepted_username].sendUTF(JSON.stringify(message));
        }catch(e){
            console.log(e);
            message.content.status = false; //The user is disconnected.
        }

        message.content.username = accepted_username;

        connection.sendUTF(JSON.stringify(message));
    }

    this.rejectFriendReq = async function(connection, ct){
        var email = connection.email;
        var rejected_username = ct.username;

        var message = await this.CORE.DB.rejectFriendReq(email, rejected_username);

        message.type = "reject_fr_request";

        connection.sendUTF(JSON.stringify(message));
    }

    this.friendMessage = function(connection, ct){

        var username = connection.username;
        var text = ct.text;
        var dest_username = ct.username;

        var message = {
            type: "fc_message",
            content: {
                username: username,
                text: text
            }
        }

        this.CORE.DB.storeFriendMessage(username, dest_username, text);

        if(this.CORE.username_connection[dest_username]) this.CORE.username_connection[dest_username].sendUTF(JSON.stringify(message));

    }

    this.changeRoomTexture = function(connection, ct){
        var room_name = connection.room_name;
        var texture_img_src = ct.texture_img_src;
        this.CORE.roomsManager.changeRoomTexture(room_name, texture_img_src);
    }

    this.processMessage = async function(message, connection){

        var ct = message.content;
        switch(message.type){
            case "room_access":
                this.printMessage(await this.validateRoomAccess(connection, ct));
                break;
            case "broadcast_position":
                this.printMessage(this.updateUserPosition(connection, ct));
                break;
            case "controls":
                this.printMessage(this.takeUserControls(connection, ct));
                break;
            case "gc_message":
                this.printMessage(this.globalMessage(connection, ct));
                break;
            case "fr_request":
                this.printMessage(this.friendRequest(connection, ct));
                break;
            case "accept_fr_request":
                this.printMessage(this.acceptFriendReq(connection, ct));
                break;
            case "reject_fr_request":
                this.printMessage(this.rejectFriendReq(connection, ct));
                break;
            case "fc_message":
                this.printMessage(this.friendMessage(connection, ct));
                break;
            case "change_room_texture":
                this.printMessage(this.changeRoomTexture(connection, ct));
                break;
        }
    };
}

module.exports = MessagesManager;