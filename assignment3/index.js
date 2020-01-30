const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const auth = require('basic-auth');
const User = require('./sequelize').User;
const Bill = require('./sequelize').Bill;
const compare = require('tsscmp');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const uuidv1 = require('uuid/v1');

app.use(bodyParser.json())

// Create user
app.post('/v1/user', (req, res) => {
    let psw = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email_address = req.body.email_address;
    if (psw.length < 8) {
        console.log("Password should be minimum of 8 characters...")
        res.status(400).send("Password should be minimum of 8 characters");
    } else if (!first_name || !last_name || !psw || !email_address) {
        res.status(400).send({
            Message: "Please provide all required fields - first_name, last_name, password, email_address"
        });
    } else {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            let id = uuidv1();
            var today = new Date();
            let createdAt = today;
            let updatedAt = today;
            console.log(req.body)
            let data = { id, first_name, last_name, email_address, createdAt, updatedAt }
            User.findOne(
                { where: { email_address: req.body.email_address } }
            ).then(user => {
                if (user) {
                    res.status(400).send("User already registered")
                } else {
                    User.create({
                        id, first_name: req.body.first_name, last_name: req.body.last_name, password: hash, email_address: req.body.email_address, createdAt, updatedAt
                    }).then(user => res.status(201).json(data)).catch(err => {
                        console.log(err);
                        res.status(400).end()
                    });
                };
            });
        });
    };
})


// get user
app.get('/v1/user/self', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var data = {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email_address: user.email_address,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
                console.log(data)
                return res.status(200).json(data)
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

// update user
app.put('/v1/user/self', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                let psw = req.body.password;
                if (psw.length < 8) {
                    console.log("Password should be minimum of 8 characters...")
                    res.status(400).send("Password should be minimum of 8 characters");
                } else {
                    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

                        var today = new Date();
                        let updatedAt = today;
                        User.update({
                            first_name: req.body.first_name, last_name: req.body.last_name, password: hash, updatedAt
                        }, {
                            where: { email_address: req.body.email_address }
                        }).then(user => res.status(204).end()).catch(err => {
                            console.log(err);
                            res.status(400).end();
                        });
                    });
                };
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

// create bill
app.post('/v1/bill', (req, res) => {
    let vendor = req.body.vendor;
    let bill_date = req.body.bill_date;
    let due_date = req.body.due_date;
    let amount_due = req.body.amount_due;
    let categories = req.body.categories;
    let payment_status = req.body.payment_status;

    let id = uuidv1();
    var today = new Date();
    let createdAt = today;
    let updatedAt = today;

    console.log(req.body)

    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var owner_id = user.id;
                let data = { id, owner_id, createdAt, updatedAt, vendor, bill_date, due_date, amount_due, categories, payment_status }
                if (!vendor || !bill_date || !due_date || !amount_due || !categories || !payment_status) {
                    res.status(400).send({
                        Message: "Please provide all required fields - vendor, bill_date, due_date, amount_due, categories, payment_status(paid/due/past_due/no_payment_required) "
                    });
                } else {
                    Bill.create({
                        id, vendor, bill_date, due_date, amount_due, categories, payment_status, createdAt, updatedAt
                    }).then(bill => {
                        Bill.update({ owner_id }, { where: { id: id } }).then(bill => res.end())
                        res.status(201).json(data)
                    }).catch(err => {
                        console.log(err);
                        res.status(400).end()
                    });
                };
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')
        });
    };
});


// get bills
app.get('/v1/bills', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var owner_id = user.id;
                Bill.findAll({ where: { owner_id: owner_id } }).then(bill => {
                    return res.status(200).json(bill)
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

// get bill by id
app.get('/v1/bill/:id', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var owner_id = user.id
                Bill.findOne(
                    {
                        where: { id: req.params.id, owner_id: owner_id },
                    }
                ).then(bill => res.status(200).json(bill)).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": err
                    })
                })
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

// update bill by id
app.put('/v1/bill/:id', (req, res) => {
    let vendor = req.body.vendor;
    let bill_date = req.body.bill_date;
    let due_date = req.body.due_date;
    let amount_due = req.body.amount_due;
    let categories = req.body.categories;
    let payment_status = req.body.payment_status;

    var today = new Date();
    let updatedAt = today;

    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var owner_id = user.id;
                let data = { id: req.params.id, updatedAt, owner_id, vendor, bill_date, due_date, amount_due, categories, payment_status }
                Bill.update({
                    vendor, bill_date, due_date, amount_due, categories, payment_status
                }, {
                    where: {
                        id: req.params.id, owner_id: owner_id
                    }
                }).then(bill => res.status(200).json(data)).catch(err => {
                    console.log(err);
                    res.status(400).end();
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

// delete bill
app.delete('/v1/bill/:id', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findOne({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user.email_address) && valid;
            valid = bcrypt.compareSync(password, user.password) && valid;
            if (valid) {
                var owner_id = user.id
                Bill.destroy({
                    where: { id: req.params.id, owner_id: owner_id }
                }).then(function (result) {
                    res.status(204).end();
                }).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": err
                    });
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Unauthorized : Authentication error')

        });
    };
});

const port = 3001
app.listen(port, () => {
    console.log("Running on port " + port);
});;

module.exports = app;