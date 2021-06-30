var Room = require('./room.js');

function RoomsManager(CORE){
    this.CORE = CORE;
    this.active_rooms = {};

    this.newUser = function(connection, json_room_data){
        var room_name = json_room_data.room_info.room_name;
        var username = connection.username;
        var email = connection.email;
        var informUsers = true;

        if(!this.active_rooms[room_name]){
            console.log("Creating new room: " + room_name);
            var room = new Room(json_room_data);
            this.active_rooms[room_name] = room;
            informUsers = false;
        }
        
        this.active_rooms[room_name].joinUser(connection, informUsers);

        return this.active_rooms[room_name].getInitState();
        
    };

    this.removeUser = function(room_name, username){
        var num_characters = Object.keys(this.active_rooms[room_name].characters).length;
        if(num_characters == 0){
            delete this.active_rooms[room_name];
            return;
        }

        this.active_rooms[room_name].disconnectUser(username);

    }

    this.updateUserPosition = function(username, room_name, position, rotation){
        this.active_rooms[room_name].updateUserPosition(username, position, rotation);
    };

    this.updateUserControls = function(username, room_name, key, pressed){
        this.active_rooms[room_name].updateUserControls(username, key, pressed);
    }

    this.globalMessage = function(username, room_name, text){
        this.active_rooms[room_name].globalMessage(username, text);
    }

    this.changeRoomTexture = function(room_name, texture_img_src){
        this.active_rooms[room_name].changeRoomTexture(texture_img_src);
        this.CORE.DB.changeRoomTexture(room_name, texture_img_src, this.active_rooms[room_name].json_room);
    }

}

module.exports = RoomsManager;