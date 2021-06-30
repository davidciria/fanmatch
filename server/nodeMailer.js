function NodeMailer(){
    var nodemailer = require('nodemailer');

    this.sendPasswordRecoveryEmail = function(destEmail, verificationCode){
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
                user: 'fanmatchteam@gmail.com',
                pass: 'herci1999'
            }
        });
        const mailOptions = {
            from: 'fanmatchteam@gmail.com', // sender address
            to: destEmail, // list of receivers
            subject: 'Recovery code - Fanmatch', // Subject line
            html: '<p>Your verification code is ' + verificationCode +'</p>'// plain text body
        };
        transporter.sendMail(mailOptions, function (err, info) {
        if(err)
            console.log(err)
        else
            console.log(info);
        });
    }
}

module.exports = NodeMailer;