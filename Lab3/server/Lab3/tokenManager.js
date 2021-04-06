function TokenManager(){
    const llave = "skdiaksadoksadoksdoaksado";
    var jwt = require('jsonwebtoken');
    var expiresTime = 86400; //In seconds.
    var expiresRecoveryTime = 600;
    var recoveryCodeToToken = {}; //Dict to recover the token.

    this.pickFiveRandomChars = function(token){
        var tokenLength = token.length;
        var randomIdx;
        var code = "";
        for(var it = 0; it < 5; it++){
            randomIdx = Math.floor(Math.random() * tokenLength);
            console.log(randomIdx);
            code = code + token[randomIdx]; 
        }
        return code;
    }
    
    this.generateToken = function(username){
        const payload = {
            username: username,
            //check:  true
        };
        const token = jwt.sign(payload, llave, {
            expiresIn: expiresTime
        });

        return token;
    }

    this.generateRecoveryToken = function(email){
        console.log(email);
        const payload = {
            email: email,
            //check:  true
        };
        const token = jwt.sign(payload, llave, {
            expiresIn: expiresRecoveryTime
        });

        var code = this.pickFiveRandomChars(token); 
        recoveryCodeToToken[code] = token;

        return code;
    }

    this.validateToken = async function(token){
        if (token) {
            var result = false; //To store the result of validating token.
            await jwt.verify(token, llave, (err, decoded) => {      
                if (err) {
                    console.log("Invalid token");
                    result = false;    
                } else { 
                    console.log(decoded);
                    result = true;
                }
            });
            return result;
        } else {
            return false;
        }
    }

    this.validateRecoveryToken = async function(code){

        var token = recoveryCodeToToken[code];
        if (token) {
            var result = false; //To store the result of validating token.
            await jwt.verify(token, llave, (err, decoded) => {      
                if (err) {
                    console.log("Invalid token");
                    result = false;    
                } else { 
                    console.log(decoded);
                    result = decoded;
                }
            });
            return result;
        } else {
            console.log("returning false");
            return false;
        }
    },
    this.deleteRecoveryToken = function(code){
        delete recoveryCodeToToken[code];
    }
}

module.exports = TokenManager;

// tokenManager = new Token();

// token = tokenManager.generateToken("paquito");

// console.log(token);

// tokenManager.validateToken(token);

// setInterval(function(){
//     tokenManager.validateToken(token);
// }, 14000);