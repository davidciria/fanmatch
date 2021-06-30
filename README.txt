-----------------------------
Fanmatch - ECV Final Project
-----------------------------
Students:
Name: Àngel Herrero     NIA: 205310
Name: David Ciria       NIA: 206038

Video demonstration:  https://youtu.be/mDpVshJxpRM

Functionalities:
    At the web:
    - User can register / login.
    - When the user login a token is assigned to him (it has a duration of 1 day).
    - User can recover his password throw a code (token) sent to his email (sending email API is used).
    - Public room creation (without password).
    - Private room creation (with password).
    - Form validation at user register / login and room create / join to control that there is no meaningless data
    sent to the server and to make this more clear to the user.
    - Server errors managed and feedback sent to the user.

    Security:
        -   We use Jason Web Token to be able to store the session of the user and ask for authorization without asking the password.
        -   We store all the password, of users and rooms, hashed and with salt.
        -   Possibility to make private rooms with passwords.

    At the virtual environment:
        UI:
        - Four panels created to enhance the interaction with the application and other users:
            - Global chat: Where the user can communicate with the other users of the room and it can be seen the name of the room.
            - Room settings: Only visible by the owner of the server, where the style of the room can be changed (the change is stored in the 
              database and updated in real-time).
            - Add Friends: Where the user can send friend requests and accept or reject them. We verify the different cases that could occur.
            - Friends: Where it can be seen the status of your friends, you can also talk to them or join their room if they are connected, 
              the chat is stored in the database.
        - Navbar: You can go "Home" where you can go back to the join / create room area or press the "Logout" button to close the session.

        Synchronization:
        -  We send the controls of the user (when the keys are pressed and release), and the position only when a key is pressed or released,
           which makes the synchronization much more efficient than sending the position every (or almost every) frame.
        -  When user connects / disconnects all his friends are informed and the status is updated for them, making it easy to know if you can
           join or not to his room.

        Controls:
        -   Key W, A, S, D: User movement (straight on, left, backwards, right).
        -   Key Space: Celebration.
        -   Key V: Toggle see full canvas television.

NodeJS libraries:
    - jsonwebtoken (to manage user login / recovery tokens).
    - nodemailer (to send recovery password emails).
    - redis (database).
    - md5 (hash passwords and rooms secret codes).
    - util (convert redis callbacks to promises).