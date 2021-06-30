var redis = require('redis');
var NodeMailer = require('./nodeMailer.js');
var TokenManager = require("./tokenManager.js");
const util = require('util');
var redis_namespace = "davanDB:";
var md5 = require('md5');
var rnd_string = "·IRHBDA^D*^QÑD*Q^WDÑ·?$L!$*^!Ñ=?%Y·M$%OHMPOB POpoponadspfinwei)·$=?)umñnaskfnaldkfjp)opfienwoeh($h"
var default_scene_json = require('./default_scene.json');

var DB = {
    redis: null,
    nodeMailer: new NodeMailer(),
    tokenManager: new TokenManager(),
    users: [],
    restart: null, //Funtion to restart the DB.
    rooms_salt: "joasds3sdaa934kdas", //Default salt for every room.
    registerUser: async function (register_parameters) {

        var username = register_parameters.reg_username;
        var email = register_parameters.reg_email;
        var salt = md5(String(Math.random() + String(Date.now() + rnd_string)));
        var password = md5(salt + register_parameters.reg_password);

        var user_info = {
            username: username,
            email: email,
            salt: salt,
            password: password
        };

        user_info = JSON.stringify(user_info);

        //Verify if the username already exists.
        try {
            const reg_username_email = await this.redis.get(redis_namespace + 'indexes_tables:users:username_email:' + username);
            if (reg_username_email) { //Username already in use.
                if (reg_username_email == email) return "User already registered"; //The user is already registered.
                return "Username is currently in use";
            }
        } catch (e) {
            console.error(e);
            return e;
        }

        //Verify if the user email already exists.
        try {
            const reg_email = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
            if (reg_email) return "This email is already in use";
        } catch (e) {
            console.error(e);
            return e;
        }

        //Store password and username.
        try{
            await this.redis.set(redis_namespace + 'users:' + email + ":user_info", user_info);
            await this.redis.set(redis_namespace + 'indexes_tables:users:username_email:' + username, email);
        }catch (e) {
            console.error(e);
            return "false";
        }

        console.log("New user registered: " + email);

        return "User successful registered";
    },
    loginUser: async function (login_parameters) {
        var email = login_parameters.log_email;
        var password = login_parameters.log_password;

        function verifyPassword(user_info) {
            user_info = JSON.parse(user_info);
            if (user_info.password == md5(user_info.salt + password)) {
                return user_info;
            } else {
                return false;
            }
        }

        try {
            const user_info = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
            if (user_info) {
                return verifyPassword(user_info);
            } else {
                return -1;
            }
        } catch (e) {
            console.error(e);
            return e;
        }

    },
    passwordRecovery: async function(email){
        var user_info;
        //Verify if the user email exists.
        try {
            user_info = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
            if (!user_info) return "false";        
        } catch (e) {
            console.error(e);
            return e;
        }

        var token = this.tokenManager.generateRecoveryToken(email);

        this.nodeMailer.sendPasswordRecoveryEmail(email, token);

        return "true";

    },
    passwordRecoveryValidation: async function(code){
        var result = await this.tokenManager.validateRecoveryToken(code);
        if(result) return "true";
        return "false";
    },
    passwordRecoveryNewPassword: async function(code, newPassword){
        var result = await this.tokenManager.validateRecoveryToken(code);
        var email = result.email;
        this.tokenManager.deleteRecoveryToken(code); //Ivalidate recovery token, because we are changing the password.
        if(email){
            //Get user info.
            var user_info;
            try {
                user_info = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
                if (!user_info) return "false";
                user_info = JSON.parse(user_info);
            } catch (e) {
                console.error(e);
                return e;
            }

            //Generate new salt and password.
            var salt = md5(String(Math.random() + String(Date.now() + rnd_string)));
            var password = md5(salt + newPassword);

            user_info.salt = salt;
            user_info.password = password;

            user_info = JSON.stringify(user_info);

            //Update user password.
            try{
                await this.redis.set(redis_namespace + 'users:' + email + ":user_info", user_info);
            }catch (e) {
                console.error(e);
                return "false";
            }

            return "true";

        }

        return "false";
    },
    createDefaultRoom: async function(email, room_name, secret_code=""){

        //Verify if the room already exists.
        try {
            const db_room_info = await this.redis.get(redis_namespace + 'rooms:' + room_name);
            if (db_room_info) { //Username already in use.
                return {error: "The room name already exists"};
            }
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        var user_info;
        
        try {
            user_info = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
            if (!user_info) return {error: "Cannot find the user"};
            user_info = JSON.parse(user_info);
        } catch (e) {
            console.error(e);
            return e;
        }

        var room_info = {
            owner: user_info["username"],
            room_name: room_name,
            secret_code: (secret_code == "") ? secret_code : md5(this.rooms_salt + secret_code) //Secret code hashed.
        }

        var default_scene = JSON.parse(JSON.stringify(default_scene_json));

        default_scene.room_info = room_info;

        //Create room in the DB.
        try {
            await this.redis.set(redis_namespace + 'rooms:' + room_name, JSON.stringify(default_scene));
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {};
    },
    joinRoom: async function(room_name){

        var room_data;
        
        try {
            room_data = await this.redis.get(redis_namespace + 'rooms:' + room_name);
            if (!room_data) return {error: "Cannot find the room"};
            room_data = JSON.parse(room_data);
        } catch (e) {
            console.error(e);
            return e;
        }

        //Public room.
        if(room_data.room_info.secret_code == ""){
            delete room_data.room_info.secret_code;
            return {};
        }
        
        return {private: true}; //Private room, has secret code.

    },
    joinRoomWithCode: async function(room_name, secret_code){

        var room_data;
        
        try {
            room_data = await this.redis.get(redis_namespace + 'rooms:' + room_name);
            if (!room_data) return {error: "Cannot find the room"};
            room_data = JSON.parse(room_data);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        //Public room.
        if(room_data.room_info.secret_code == ""){
            delete room_data.room_info.secret_code;
            return {};
        }

        //Verify secret code.
        if(room_data.room_info.secret_code == md5(this.rooms_salt + secret_code)){
            delete room_data.room_info.secret_code;
            return {};
        }
        
        return {error: "Incorrect secret code"}; //Private room, has secret code.
    },
    getRoomData: async function(room_name, secret_code){

        var room_data;
        
        try {
            room_data = await this.redis.get(redis_namespace + 'rooms:' + room_name);
            if (!room_data) return {error: "Cannot find the room"};
            room_data = JSON.parse(room_data);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        //Public room.
        if(room_data.room_info.secret_code == ""){
            delete room_data.room_info.secret_code;
            return {content: {room_data: room_data}};
        }

        //Verify secret code.
        if(room_data.room_info.secret_code == md5(this.rooms_salt + secret_code)){
            delete room_data.room_info.secret_code;
            return {content: {room_data: room_data}};
        }
        
        return {error: "Incorrect secret code"}; //Private room, has secret code.
    },
    saveFriendRequest: async function(username, email, dest_username){
        //Verify if the dest_username exists.
        var reg_username_email;
        try {
            reg_username_email = await this.redis.get(redis_namespace + 'indexes_tables:users:username_email:' + dest_username);
            if (!reg_username_email) { //Username already in use.
                return {error: "The user does not exist"};
            }
        } catch (e) {
            console.error(e);
            return e;
        }

        //Look if the we have a request of the other user.
        var our_req_list;
        try {
            our_req_list = await this.redis.lrange(redis_namespace + 'users:' + email + ':fr_reqs', 0, -1);
        } catch (e) {
            // console.error(e);
            // return {error: e};
        }

        if(our_req_list){
            if(our_req_list.includes(dest_username)) return {error: "You have already a request of this user"};
        }

        //Save the request.
        var req_list;
        try {
            req_list = await this.redis.lrange(redis_namespace + 'users:' + reg_username_email + ':fr_reqs', 0, -1);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        if(req_list.includes(username)) return {error: "The user was requested before"};

        //Get friends list.
        var fr_list;
        try {
            fr_list = await this.redis.lrange(redis_namespace + 'users:' + reg_username_email + ':fr_list', 0, -1);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        if(fr_list.includes(username)) return {error: "The user is already in your friends list"};

        //Save the request.
        try {
            await this.redis.lpush(redis_namespace + 'users:' + reg_username_email + ':fr_reqs', username);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {content: {
            response: "Request sent successfully to " + dest_username
        }};

    },
    acceptFriendReq: async function(username, email, accepted_username){
        //Delete request from user who accepts.
        try {
            await this.redis.lrem(redis_namespace + 'users:' + email + ':fr_reqs', 0, accepted_username);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        //Get email of accepted username.
        var acc_username_email;
        try {
            acc_username_email = await this.redis.get(redis_namespace + 'indexes_tables:users:username_email:' + accepted_username);
            if (!acc_username_email) { //Username already in use.
                return {error: "The user does not exist"};
            }
        } catch (e) {
            console.error(e);
            return e;
        }

        //Add ourself as his friend.
        try {
            await this.redis.lpush(redis_namespace + 'users:' + acc_username_email + ':fr_list', username);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        //Add him as friend.
        try {
            await this.redis.lpush(redis_namespace + 'users:' + email + ':fr_list', accepted_username);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {content: {
            response:  accepted_username + " has been added to your friends list"
        }};



    },
    rejectFriendReq: async function(email, rejected_username){

        try {
            await this.redis.lrem(redis_namespace + 'users:' + email + ':fr_reqs', 0, rejected_username);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {content: {
            response: "Request rejected successfully"
        }};

    },
    getFriendsData: async function(email){    
       
        //Get friends list.
        var fr_list;
        try {
            fr_list = await this.redis.lrange(redis_namespace + 'users:' + email + ':fr_list', 0, -1);
        } catch (e) {
            console.error(e);
        }

        if(!fr_list) fr_list = [];

        //Get requests list.
        var req_list;
        try {
            req_list = await this.redis.lrange(redis_namespace + 'users:' + email + ':fr_reqs', 0, -1);
        } catch (e) {
            console.error(e);
        }

        if(!req_list) req_list = [];

        return({req_list: req_list, fr_list: fr_list});

    },
    storeFriendMessage: async function(username, dest_username, text){

        var usernames = [username, dest_username].sort();

        var username_message = {
            username: username,
            text: text
        }
        //Add him as friend.
        try {
            await this.redis.rpush(redis_namespace + 'chats:' + usernames[0] + "_" + usernames[1], JSON.stringify(username_message));
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {content: {
            response: true
        }};
    },
    retrieveMessages: async function(username, dest_username){

        var usernames = [username, dest_username].sort();

        var all_msgs;
        try {
            all_msgs = await this.redis.lrange(redis_namespace + 'chats:' + usernames[0] + "_" + usernames[1], 0, -1);
        } catch (e) {
            console.error(e);
        }

        if(all_msgs){
            var json_msgs = [];
            all_msgs.forEach(m => {
                json_msgs.push( JSON.parse(m) );
            });
        }

        return {
            content: {
                json_msgs: json_msgs
            }
        };

    },
    changeRoomTexture: async function(room_name, texture_img_src, json_room){

        var room_data;
        try {
            room_data = await this.redis.get(redis_namespace + 'rooms:' + room_name);
            room_data = JSON.parse(room_data);
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        json_room.room_info.secret_code = room_data.room_info.secret_code;
        
        try {
            await this.redis.set(redis_namespace + 'rooms:' + room_name, JSON.stringify(json_room));
        } catch (e) {
            console.error(e);
            return {error: e};
        }

        return {
            content: {
                room_name: room_name,
                texture_img_src: texture_img_src
            }
        };

    }
}

var client = DB.redis = redis.createClient();
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);
client.lrem = util.promisify(client.lrem);
client.lpush = util.promisify(client.lpush);
client.lrange = util.promisify(client.lrange);
client.rpush = util.promisify(client.rpush);

client.on('connect', function () {
    console.log('Redis database connected successful');
});

module.exports = DB;