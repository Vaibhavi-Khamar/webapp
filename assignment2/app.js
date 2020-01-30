const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mysql = require('mysql');
const conn = require('./db.js');
const router = express.Router();
const postrouter = require('./routes.js');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const uuidv1 = require('uuid/v1');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//GET
router.route('/user/self/:email_address')
    .get((req, res) => {
        let email_address = req.params.email_address;
        //console.log(email_address);
        if (!email_address) {
            return res.status(400).send({ error: true, message: 'Please provide email_address' });
        }
        conn.query("SELECT id,first_name,last_name,email_address,account_created,account_updated FROM users WHERE email_address=?", email_address, (err, result, fields) => {
            if (err) throw err;
            console.log("error ocurred", err);
            console.log("Successfully fetched user info...")
            console.log(result);
            res.status(200).json(result);
        })
    });

router.route('/user/self')
    .get((req, res) => {
        //app.get('/user/self', auth, function (req, res) {        
        conn.query("SELECT id,first_name,last_name,email_address,account_created,account_updated FROM users", (err, result, fields) => {
            if (err) throw err;
            console.log("ERROR: " + err)
            console.log("Successfully fetched user info...")
            console.log(result);
            res.status(200).json(result);
        })
    });

//PUT
router.route('/user/self')
    .put((req, res) => {
        let psw = req.body.password;
        if (psw.length < 8) {
            console.log("Password should be minimum of 8 characters...")
            res.status(400).send("Password should be minimum of 8 characters");
        } else {
            bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

                let first_name = req.body.first_name;
                let last_name = req.body.last_name;
                let password = hash;
                let email_address = req.body.email_address;
                var today = new Date();
                let account_updated = today;

                conn.query('UPDATE `users` SET `first_name`=?,`last_name`=?,`password`=? where  `email_address`=?', [first_name, last_name, password, email_address], function (error, results, fields) {
                    if (error) {
                        console.log("Error Ocurred: ", error);
                        res.status(400).end();
                    } else {
                        conn.query('UPDATE `users` SET `account_updated`=? where  `email_address`=?', [account_updated, email_address], function (err, result, fields) {
                            if (err) throw err;
                            console.log("account_updated working")
                            res.end();
                        });
                        console.log('User has been updated successfully.');
                        console.log(results);
                        res.status(204).end();
                    }
                });
            });
        }
    });


//app.use('/v1', router);
app.use('/v1', postrouter);

function auth(req, res, next) {
    var authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }
    var auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':');
    var username = auth[0];
    var password = auth[1];
    //console.log(password)
    let mail_address = auth[0];
    var u_name,p_psw;
    let uname = conn.query("SELECT email_address FROM users WHERE email_address=?", mail_address, (err, result, fields) => {
        if (err) throw err;
        console.log("uname: " +result[0].email_address)      
       // console.log(JSON.stringify(result))
        //  var string = JSON.stringify(result)
        u_name = result[0].email_address
        res.end();
    });
    console.log("username:"+ uname)
    let psw = conn.query("SELECT password FROM users WHERE email_address=?", mail_address, (err, result, fields) => {
        if (err) throw err;
        console.log(result)
        console.log("psw: " +result[0].password); 
        console.log(JSON.stringify(result[0].password)); 
        // console.log(toString(result[0].password)); 
        p_psw = result[0].password
        return JSON.stringify(result[0].password);
    });
    console.log("password is:" +p_psw);
    
    //let pswstring = JSON.stringify(psw)
    // console.log(pswstring)
    //let pswd = bcrypt.compare(password, psw);
    // console.log(pswd)
    if (username === uname && bcrypt.compare(password, psw)) {

        next();
    } else {
        return res.status(401).json({ message: 'invalid Authorization credentials' });
    }
}
app.use(auth);

app.use('/v1', router);


app.get('/', (req, res) => {
    res.send('Welcome to my API!');
});

app.listen(port, () => {
    console.log("Running on port " + port);
});

module.exports = app;