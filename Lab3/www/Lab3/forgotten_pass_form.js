var forgotten_pass_link = document.querySelector("#forgotten_pass_link");

var forgotten_pass_area = document.querySelector("#forgotten_pass_area");
var register_area = document.querySelector("#register_area");

forgotten_pass_link.addEventListener("click", function(event){
    event.preventDefault();

    forgotten_pass_area.style.setProperty('display', 'flex', 'important');
    register_area.style.setProperty('display', 'none', 'important');

});

var input_fp_email = document.querySelector("#fp_email");

input_fp_email.addEventListener('change', function(){ validateField(validateEmail, this) });
input_fp_email.addEventListener('keyup', function(){ validateField(validateEmail, this) });

var forgotten_pass_form = document.querySelector("#forgotten_pass_form");

var input_fp_code = document.querySelector('#fp_code');
var forgotten_pass_code_form = document.querySelector('#forgotten_pass_code_form');

var forgotten_pass_new_pass_form = document.querySelector('#forgotten_pass_new_pass_form');


forgotten_pass_form.addEventListener('submit', function(event){
    event.preventDefault();

    //Validacion del formato del email.
    //Comprobar que el email esta en la base de datos.
    //Enviar un email con un codigo (token) al email.

    fetch("/node/9007/passwordRecovery", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: input_fp_email.value
    }).then(response=>response.text())
    .then(data=>{
        console.log(data); 
        if(data == 'true'){ //Email send successful.
            window.alert("A verification code has been sent to your email");

            forgotten_pass_form.style.display = "none";
            forgotten_pass_code_form.style.display = "";
        } else { //Email doesn't exist.
            window.alert('The email is not registered');
        }
    });
    
});

forgotten_pass_code_form.addEventListener("submit", function(event){
    event.preventDefault();

    fetch("/node/9007/passwordRecoveryValidation", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: input_fp_code.value
    }).then(response=>response.text())
    .then(data=>{
        console.log(data); 
        if(data == 'true'){ //New password
            window.alert("Now you can change your password");

            forgotten_pass_new_pass_form.style.display = "";
            forgotten_pass_code_form.style.display = "none";
        } else { //Code incorrect
            window.alert('The verification code is not valid');
        }
    });
    
});

var input_fp_password = document.querySelector("#fp_password");

input_fp_password.addEventListener('change', function(){ validateField(validatePassword, this) });
input_fp_password.addEventListener('keyup', function(){ validateField(validatePassword, this) });

input_fp_password.addEventListener('invalid', function(){ this.setCustomValidity(invalid_password_msg); });
input_fp_password.addEventListener('input', function(){this.setCustomValidity(""); });

forgotten_pass_new_pass_form.addEventListener("submit", function(event){

    event.preventDefault();

    fetch("/node/9007/passwordRecoveryNewPassword", {
        method: "POST", 
        headers: {
            'Content-Type': 'text/html',
        },
        body: JSON.stringify({code: input_fp_code.value, new_password: input_fp_password.value})
    }).then(response=>response.text())
    .then(data=>{
        console.log(data); 
        if(data == 'true'){ //New password
            window.alert("Password changed successful");

            register_area.style.setProperty('display', 'flex', 'important');
            forgotten_pass_area.style.setProperty('display', 'none', 'important');

            forgotten_pass_form.style.display = "";
            forgotten_pass_new_pass_form.style.display = "none";
        } else { //Code incorrect
            window.alert('Some error has ocurred. The code probably has expired, try again.');
        }
    });

});