var redis = require('redis');
var NodeMailer = require('./nodeMailer.js');
var TokenManager = require("./tokenManager.js");
const util = require('util');
var redis_namespace = "davanDB:";
var md5 = require('md5');
var rnd_string = "·IRHBDA^D*^QÑD*Q^WDÑ·?$L!$*^!Ñ=?%Y·M$%OHMPOB POpoponadspfinwei)·$=?)umñnaskfnaldkfjp)opfienwoeh($h"

var DB = {
    redis: null,
    nodeMailer: new NodeMailer(),
    tokenManager: new TokenManager(),
    users: [],
    restart: null, //Funtion to restart the DB.
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
        this.redis.set(redis_namespace + 'users:' + email + ":user_info", user_info);
        this.redis.set(redis_namespace + 'indexes_tables:users:username_email:' + username, email);

        return "User successful registered";
    },
    loginUser: async function (login_parameters) {
        var email = login_parameters.log_email;
        var password = login_parameters.log_password;

        function verifyPassword(user_info) {
            user_info = JSON.parse(user_info);
            if (user_info.password == md5(user_info.salt + password)) {
                console.log('Hashed password is ' + user_info.password);
                return true;
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
        console.log(newPassword);
        var result = await this.tokenManager.validateRecoveryToken(code);
        var email = result.email;
        this.tokenManager.deleteRecoveryToken(code); //Ivalidate recovery token, because we are changing the password.
        if(email){
            //Get user info.
            var user_info;
            try {
                user_info = await this.redis.get(redis_namespace + 'users:' + email + ':user_info');
                user_info = JSON.parse(user_info);
                if (!user_info) return "false";
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
            this.redis.set(redis_namespace + 'users:' + email + ":user_info", user_info);

            return "true";

        }

        return "false";
    }
}

var client = DB.redis = redis.createClient();
client.get = util.promisify(client.get);

client.on('connect', function () {
    console.log('connected');
});

module.exports = DB;