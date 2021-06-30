//Each scene represents one room where you can see TV with your friends.
function Room(roomJSON){
    this.json_room = roomJSON;
    this.CHARACTERS_LAYER = 4; //4 is 100 in binary.
    this.OBJECTS_LAYER = 3; //4 is 100 in binary.
    this.characters = {};
    this.objects = this.json_room.objects;
    this.walk_area = this.json_room.walk_area;

    this.joinUser = function(connection, informUsers){
        var character = {
            data: {
                name: connection.username,
                scale: 0.35,
                mesh: "data/export.wbin",
                texture: "data/defaultMaleA.png",
                anim_name: "idle",
                variable: 0, //For the blending.
                controls: {
                    a: false,
                    w: false,
                    s: false,
                    d: false,
                    space: false
                }
            },
            connection: connection
        };

        if(this.characters[character.data.name]){
            console.error("Character already logged in the room");
        }

        if(informUsers){
            var message = {
                type: "user_connected",
                content: {
                    character: character.data
                }
            };

            Object.entries(this.characters).forEach(([name, value]) => {
                value.connection.sendUTF(JSON.stringify(message));
            });
        }
        
        this.characters[character.data.name] = character;
    }

    this.disconnectUser = function(username){
        delete this.characters[username];

        var message = {
            type: "user_disconnected",
            content: {
                username: username
            }
        };

        Object.entries(this.characters).forEach(([name, value]) => {
            value.connection.sendUTF(JSON.stringify(message));
        });
    }

    this.updateUserPosition = function(username, position, rotation){
        this.characters[username].data.position = position;
        this.characters[username].data.rotation = rotation;

        var message = {
            type: "position_update",
            content: {
                username: username,
                position: position,
                rotation: rotation
            }
        };

        Object.entries(this.characters).forEach(([name, value]) => {
            if(name != username) value.connection.sendUTF(JSON.stringify(message));
        });
    }

    this.updateUserControls = function(username, key, pressed){

        this.characters[username].data.controls[key] = pressed;

        var message = {
            type: "controls",
            content: {
                username: username
            }
        };
        message.content[key] = pressed;

        Object.entries(this.characters).forEach(([name, value]) => {
            if(name != username) value.connection.sendUTF(JSON.stringify(message));
        });

    }

    this.globalMessage = function(username, text){

        var message = {
            type: "gc_message",
            content: {
                username: username,
                text: text
            }
        };

        Object.entries(this.characters).forEach(([name, value]) => {
            if(name != username) value.connection.sendUTF(JSON.stringify(message));
        });

    }

    this.getInitState = function(){
        var init_state = JSON.parse(JSON.stringify(this.json_room));
        init_state.scene.characters = [];
        Object.entries(this.characters).forEach(([name, value]) => {
            init_state.scene.characters.push(value.data);
        });

        return init_state;
    }

    this.changeRoomTexture = function(texture_src){
        this.json_room.scene.objects.find(o => o.name == "room").textures_color = texture_src;

        var message = {
            type: "change_room_texture",
            content: {
                texture_img_src: texture_src
            }
        };

        Object.entries(this.characters).forEach(([name, value]) => {
            value.connection.sendUTF(JSON.stringify(message));
        });
        return true;
    }

    this.exportJSON = function(){
        return JSON.stringify(this.json_room);
    }
    
}

module.exports = Room;