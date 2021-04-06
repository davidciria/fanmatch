var register_form = document.querySelector("#register_form");

function validateUsername(username) {
    var re = /^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
    return re.test(String(username));
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(String(password));
}

var input_username = document.querySelector("#reg_username");
var input_email = document.querySelector("#reg_email");
var input_password = document.querySelector("#reg_password");

invalid_username_msg = "Invalid username: Username can contain alphanumeric characters, underscores and dots. Underscores and dots can't be consecutive. Number of characters must be between 8 to 20."
input_username.addEventListener('invalid', function(){ this.setCustomValidity(invalid_username_msg); });
input_username.addEventListener('input', function(){ this.setCustomValidity(""); });

invalid_password_msg = "Invalid password: Minimum eight characters, at least one uppercase letter, one lowercase letter and one number"
input_password.addEventListener('invalid', function(){ this.setCustomValidity(invalid_password_msg); });
input_password.addEventListener('input', function(){this.setCustomValidity(""); });

function validateField(validationFunction, input){
    if(validationFunction(input.value)) input.style.borderColor = "#ADFFA8";
    else input.style.borderColor = "#FFA8A8";
}

input_username.addEventListener('change', function(){ validateField(validateUsername, this) });
input_username.addEventListener('keyup', function(){ validateField(validateUsername, this) });

input_email.addEventListener('change', function(){ validateField(validateEmail, this) });
input_email.addEventListener('keyup', function(){ validateField(validateEmail, this) });

input_password.addEventListener('change', function(){ validateField(validatePassword, this) });
input_password.addEventListener('keyup', function(){ validateField(validatePassword, this) });

register_form.addEventListener('submit', function(event){
    event.preventDefault();

    var register_parameters = {};
    var register_elements = {}

    var input_elements = this.querySelectorAll("input");
    for(var i of input_elements){
        if(i.type != "submit"){
            register_parameters[i.name] = i.value;
            register_elements[i.name] = i;
        }
    }

    fetch("/node/9007/registerForm", {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(register_parameters)
    }).then(response=>response.text())
    .then(data=>{ window.alert(data); })
    .catch(err => window.alert(err));
});