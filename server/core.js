var DB = require("./database.js");
var TokenManager = require("./tokenManager.js");
var MessagesManager = require("./messagesManager.js");
const RoomsManager = require("./roomsManager.js");

var CORE = {
    DB: DB,
    clients: {},
    tokenManager: new TokenManager(),
    messagesManager: null,
    roomsManager: null,
    num_clients: 0,
    last_id: 0,
    username_connection: {},
    init: function(){
        console.log("Launching...");

        this.messagesManager = new MessagesManager(this);
        this.roomsManager = new RoomsManager(this);

    },
    onHTTPRequest: async function(request, response){

        console.log("Request URL:", request.url);

        switch(request.url){
            case "/numClients":
                return "Users: " + this.num_clients;
                break;
            case "/registerForm":
                var register_parameters =  JSON.parse(request.body);
                return DB.registerUser(register_parameters);
                break;
            case "/loginForm":
                var login_parameters =  JSON.parse(request.body);
                
                const server_res = await DB.loginUser(login_parameters);

                if(server_res.email){
                    var token = this.tokenManager.generateToken(server_res.email, server_res.username);
                    return "Correct password:" + token + ":" + server_res.username; //Correct password.
                }else if(server_res == -1){
                    return "User not found";
                }
                return "Incorrect password";

                break;
            case "/validateToken":
                var token = request.body;
                var isValid = await this.tokenManager.validateToken(token);
                if(isValid) return "true";
                return "false";
                break;
            case "/passwordRecovery":
                var email = request.body;
                return await DB.passwordRecovery(email);
                break;
            case "/passwordRecoveryValidation":
                var code = request.body;
                return await DB.passwordRecoveryValidation(code);
                break;
            case "/passwordRecoveryNewPassword":
                var new_pass_info =  JSON.parse(request.body);
                return await DB.passwordRecoveryNewPassword(new_pass_info.code, new_pass_info.new_password);
                break;
            case "/createRoom":
                var response = {};
                
                var info = JSON.parse(request.body);
                var token = info.token;
                var room_name = info.room_name;
                var secret_code = info.secret_code;
                var payload = await this.tokenManager.validateToken(token);
                if(!payload){
                    response.error = "Invalid token";
                    return response;
                }
                var user_email = payload.email;
                return await DB.createDefaultRoom(user_email, room_name, secret_code);
                break;
            case "/joinRoom":
                var response = {};

                var info = JSON.parse(request.body);
                var token = info.token;
                var room_name = info.room_name;
                var payload = await this.tokenManager.validateToken(token);
                if(!payload){
                    response.error = "Invalid token";
                    return response;
                }
                return await DB.joinRoom(room_name);
                break;
            case "/joinRoomWithCode":
                var response = {};

                var info = JSON.parse(request.body);
                var token = info.token;
                var room_name = info.room_name;
                var secret_code = info.secret_code;
                var payload = await this.tokenManager.validateToken(token);
                if(!payload){
                    response.error = "Invalid token";
                    return response;
                }
                return await DB.joinRoomWithCode(room_name, secret_code);
                break;
            case "/userRoom":
                var response = {};
                var info = JSON.parse(request.body);
                var payload = await this.tokenManager.validateToken(info.token);
                if(!payload){
                    response.error = "Invalid token";
                    return response;
                }
                var room_n;
                if(this.username_connection[info.username]) room_n = this.username_connection[info.username].room_name;

                response.room_name = room_n;
                return response;
                break;
        }

    },
    onClientConnected: function(connection){
        var id = this.last_id++;
        this.clients[id] = connection;
        connection.user_id = id;
        this.num_clients++;
    },
    onNewMessage: function(connection, message){
        var JSON_message = JSON.parse(message.utf8Data);

        this.messagesManager.processMessage(JSON_message, connection);
    },
    onClientDisconnected: async function(connection){
        console.log("user disconnected", connection.room_name, connection.username);
        this.roomsManager.removeUser(connection.room_name, connection.username);
        
        //Get users friend list.
        var friends_data = await this.DB.getFriendsData(connection.email);

        var message = {
            type: "user_disconnected_bc",
            content :{
                username: connection.username
            }
        }

        friends_data.fr_list.forEach(u => {
            if(this.username_connection[u]) this.username_connection[u].sendUTF(JSON.stringify(message));
        });

        delete this.clients[connection.id];
        this.num_clients--;
        delete this.username_connection[connection.username];
    }
}

module.exports = CORE;