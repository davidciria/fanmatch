/* Launcher. It is going to instantiate everything and run the app. */
console.log("** Davan Server is Running **");

var CORE = require("./core.js");
var PORT = 9007;

var http = require('http');
var url = require('url');

var server = http.createServer( function(request, response) {
	// console.log("REQUEST: " + request.url );
	// var url_info = url.parse( request.url, true ); //all the request info is here
	// var pathname = url_info.pathname; //the address
	// var params = url_info.query; //the parameters
	// response.end("Number of clients connected: " + CORE.num_clients); //send a response

    body = []

    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        body = Buffer.concat(body).toString();
        // At this point, we have the headers, method, url and body, and can now
        // do whatever we need to in order to respond to this request.
        request.body = body;

        var data = await CORE.onHTTPRequest(request, response);
        console.log(data);

        if (data != null){
            if(typeof(data) == 'object') response.end(JSON.stringify(data));
            else response.end(data);
        }else{
            response.end("");
        }

    });


});

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({ // create the server
    httpServer: server //if we already have our HTTPServer in server variable...
});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    console.log("New connection in WS", request.resource);

    CORE.onClientConnected(connection);
    
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
		    CORE.onNewMessage(this, message);
        }
    });

    connection.on('close', function() {
	  CORE.onClientDisconnected(this);
    });
});

CORE.init();

server.listen(PORT, function() {
	console.log("Server listening in PORT " + PORT);
});