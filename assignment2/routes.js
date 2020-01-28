const express = require('express');
const router = express.Router();
const conn = require('./db.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const uuidv1 = require('uuid/v1');


router.route('/user')
    .post((req, res) => {
        let psw = req.body.password;
        if (psw.length < 8) {
            console.log("Password should be minimum of 8 characters...")
            res.status(400).send("Password should be minimum of 8 characters");
        } else {
            bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                //let data = req.body;
                let first_name = req.body.first_name;
                let last_name = req.body.last_name;
                let password = hash;
                let email_address = req.body.email_address;

                let id = uuidv1();
                var today = new Date();
                let account_created = today;
                let account_updated = today;

                let user = { id, first_name, last_name, password, email_address, account_created, account_updated }
                let data = { id, first_name, last_name, email_address, account_created, account_updated }

                conn.query("SELECT * from users WHERE email_address=?", email_address, (err, result) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        console.log("User already registered...")
                        res.status(400).send("User already registered");
                    }
                    else {
                        conn.query("INSERT INTO users SET ? ", user, (error, results, fields) => {
                            //conn.query("INSERT INTO users SET `first_name`=?,`last_name`=?,`password`=?, `email_address`=?", [first_name,last_name,password,email_address], (error, results) => {
                            if (error) {
                                console.log("Error Ocurred: ", error);
                                res.status(400).end();
                            } else {
                                console.log('New user has been created successfully.')
                                console.log(results)
                                console.log(req.body)
                                return res.status(201).json(data)
                            }
                        });
                    }
                });
            });
        }
    });

module.exports = router;