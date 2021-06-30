/*Class to handle messages of the global room chat*/
var gc_button = document.querySelector("#gc_button");
var gc_input = document.querySelector("#gc_input");
var gc_msg_area = document.querySelector("#gc_msg_area");

var my_msg_tmp = document.querySelector(".my_msg");
var th_msg_tmp = document.querySelector(".th_msg");



function ChatManager(){
    this.sendMessage = function(){
        var text = gc_input.value;
        gc_input.value = "";
        var my_msg = my_msg_tmp.cloneNode(true);
        my_msg.style.display = "";
        var my_txt = my_msg.querySelector(".my_txt");
        my_txt.innerText = text;
        gc_msg_area.appendChild(my_msg);

        serverClient.sendMessage(text);
    };

    this.recieveMessage = function(text, username){
        var th_msg = th_msg_tmp.cloneNode(true);
        th_msg.style.display = "";
        var th_txt = th_msg.querySelector(".th_txt");
        th_txt.innerText = text;
        var th_username = th_msg.querySelector(".th_username");
        th_username.innerText = username;
        gc_msg_area.appendChild(th_msg);
    }
}

var chatManager = new ChatManager();

gc_button.addEventListener("click", chatManager.sendMessage);
gc_input.addEventListener("keypress", function(e){
    if(e.key === 'Enter') chatManager.sendMessage();
});