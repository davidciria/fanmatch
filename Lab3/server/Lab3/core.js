var DB = require("./database.js");
var TokenManager = require("./tokenManager.js");

var CORE = {
    clients: {},
    tokenManager: new TokenManager(),
    num_clients: 0,
    last_id: 0,
    init: function(){
        console.log("Launching...");
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
                //return "Register completed";
                break;
            case "/loginForm":
                var login_parameters =  JSON.parse(request.body);
                
                const server_res = await DB.loginUser(login_parameters);
                switch(server_res){
                    case true:
                        var token = this.tokenManager.generateToken(login_parameters["log_email"]);
                        return "Correct password:" + token; //Correct password.
                        break;
                    case false:
                        return "Incorrect password";
                        break;
                    case -1:
                        return "User not found";
                        break;
                    default:
                        return "??";
                        break;
                }

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
                console.log("Payload: ");
                console.log(payload);
                if(!payload){
                    response.error = "Invalid token";
                    return response;
                }
                var user_email = payload.email;
                return await DB.createDefaultRoom(user_email, room_name, secret_code);
        }

    },
    onClientConnected: function(connection){
        var id = this.last_id++;
        this.clients[id] = connection;
        connection.user_id = id;
        this.num_clients++;
    },
    onNewMessage: function(connection, message){

    },
    onClientDisconnected: function(connection){
        delete this.clients[connection.id];
        this.num_clients++;
    }
}

module.exports = CORE;