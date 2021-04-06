function ServerClient() {

	this.user_name = null;
	this.user_id = null;
	this.room_name = null;
	this.position = {};
	this.clients = []

	this.socket = null;

	//Callbacks.
	this.on_connect = null;
	this.on_message_recieved = null;
	this.on_user_info = null;
	this.on_error = null;
}

ServerClient.prototype.connect = function (url, room_name, user_name, spritesheet_selected){
	this.socket = new WebSocket(url);

	var that = this;

	this.socket.onopen = function(){  
		that.room_name = room_name;

		that.on_connect();
		console.log("Socket has been opened! :)");
		
	}
	
	this.socket.addEventListener("close", function(e) {
		console.log("Socket has been closed: ", e); 
	});
	
	this.socket.onmessage = function(msg){  

		function IsJsonString(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}

		if(IsJsonString(msg.data)){
			var data = JSON.parse(msg.data);
			var type = data.type;
			switch(type){
				case "connection":
					var connectionMsg = {
						type: "connection",
						content: {
							room_name: room_name,
							user_name: user_name,
							spritesheet_selected: spritesheet_selected
						}
					};
					this.send(JSON.stringify(connectionMsg));  //send something to the server
					break;
				case "user_info":
					that.user_id = data.content.user_id;
					that.clients = data.content.room_clients;
					that.position.x_unitary= data.content.position.x_unitary;
					that.on_user_info();
					break;
				case "user_connected":
					console.log("User connected: " + data.content.user_id);
					that.clients.push(data.content);
					break;
				case "user_disconnected":
					console.log("User disconnected: " + data.content.user_id);
					var client = that.clients.find(c => c.user_id == data.content.user_id);
					that.clients.splice(that.clients.indexOf(client), 1);
					break;
				case "message":
					that.on_message_recieved(data.content, data.user_id); //call callback on_message_recieved.
					break;
				case "broadcast_position":
					var client = that.clients.find(c => c.user_id == data.content.user_id);
					client.dest_position.x_unitary = data.content.x_unitary_destination;
					client.on_movement = true;
					client.walking_right = (client.dest_position.x_unitary - client.position.x_unitary) > 0;
					break;
				case "error":
					if(data.content.online_user){
						that.on_error("This user is already online");
					}
					break;
				default:
					break;

			}
			
		}else{
			console.log("Data recieved is not in JSON");
			console.log(msg.data);
		}
	}
	
	this.socket.onerror = function(err){  
		console.log("error: ", err );
	}

	this.socket.onclose = function(){
		console.log("Socked has been closed");
	}
}

ServerClient.prototype.sendMessage = function (msg, user_id_array){
	var message = {
		type: "message",
		receivers: user_id_array,
		content: msg,
	}
	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.broadcastPosition = function(x_unitary_destination) {
	var destination_message = {
		type: "broadcast_position",
		content: {
			x_unitary_destination: x_unitary_destination
		}
	};

	this.socket.send(JSON.stringify(destination_message));
}

ServerClient.prototype.updatePosition = function(x_unitary_position, walking_right, on_movement){
	var position_message = {
		type: "update_position",
		content: {
			x_unitary_position: x_unitary_position,
			on_movement: on_movement,
			walking_right: walking_right
		}
	};

	this.socket.send(JSON.stringify(position_message));
}