server = new ServerClient();

server.on_connect = function(){
    console.log("Socket created");
}

server.connect("wss://ecv-etic.upf.edu/node/9007/ws/", "main", "paquito", 0);