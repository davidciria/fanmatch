/*Manage communications between client and server socket.*/
function ServerClient() {

	this.messagesManager = null;

	this.user_name = null;
	this.user_id = null;
	this.room_name = null;
	this.token = null;
	this.position = {};
	this.clients = []

	this.socket = null;

	//Callbacks.
	this.on_connect = null;
	this.on_message_recieved = null;
	this.on_user_info = null;
	this.on_error = null;
}

ServerClient.prototype.connect = function (url, room_name, secret_code, token){
	this.socket = new WebSocket(url);

	this.messagesManager = new ClientMessagesManager(this.socket, this);

	var that = this;

	this.socket.onopen = function(){  
		//that.on_connect();
		var message = {
			type: "room_access",
			content: {
				room_name: room_name,
				secret_code: secret_code,
				token: token
			}
		};
		this.send(JSON.stringify(message));
		console.log("Socket has been opened! :)");
	}
	
	this.socket.addEventListener("close", function(e) {
		console.log("Socket has been closed: ", e); 
	});
	
	this.socket.onmessage = function(data_recv){  

		function IsJsonString(str) {
			try {
				return JSON.parse(str);
			} catch (e) {
				return false;
			}
		}

		var JSON_message = IsJsonString(data_recv.data);

		that.messagesManager.processMessage(JSON_message);
		
	}
	
	this.socket.onerror = function(err){  
		console.log("error: ", err );
	}

	this.socket.onclose = function(){
		console.log("Socked has been closed");
	}
}

ServerClient.prototype.sendMessage = function (text){
	var message = {
		type: "gc_message",
		content: {
			text: text,
		},
	};
	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.sendFriendMessage = function(text, dest_username){
	var message = {
		type: "fc_message",
		content: {
			text: text,
			username: dest_username
		},
	};
	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.sendFriendRequest = function(username){

	var message = {
		type: "fr_request",
		content: {
			username: username,
		},
	};
	this.socket.send(JSON.stringify(message));

}

ServerClient.prototype.acceptFriendReq = function(username){
	var message = {
		type: "accept_fr_request",
		content: {
			username: username,
		},
	};

	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.rejectFriendReq = function(username){
	var message = {
		type: "reject_fr_request",
		content: {
			username: username,
		},
	};

	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.broadcastPosition = function(position, rotation) {
	
	var message = {
		type: "broadcast_position",
		content: {
			position: position,
			rotation: rotation
		}
	};

	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.broadcastControls = function(message) {
	this.socket.send(JSON.stringify(message));
}

ServerClient.prototype.changeRoomTexture = function(texture_img_src){
	var message = {
		type: "change_room_texture",
		content: {
			texture_img_src: texture_img_src
		}
	}
	
	this.socket.send(JSON.stringify(message));
}

var serverClient = new ServerClient();