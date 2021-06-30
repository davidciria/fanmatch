/*Handle nav menu events*/
var nb_logout = document.querySelector("#nb_logout");

nb_logout.addEventListener("click", function(event){
    event.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
});

var nb_home = document.querySelector("#nb_home");
nb_home.addEventListener("click", function(event){
    window.location.reload();
});
