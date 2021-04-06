var nb_logout = document.querySelector("#nb_logout");

nb_logout.addEventListener("click", function(event){
    event.preventDefault();
    localStorage.removeItem("token");
    window.location.reload();
});