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

const multer = require('multer');
const File = require('./sequelize').File;
const Metadata = require('./sequelize').Metadata;
const fs = require('fs');

app.use(bodyParser.json())

// Create user
app.post('/v1/user', (req, res) => {
    let psw = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email_address = req.body.email_address;
    // if (psw.length < 8) {
    //     console.log("Password should be minimum of 8 characters...")
    //     res.status(400).send("Password should be minimum of 8 characters");
    if (!first_name || !last_name || !psw || !email_address) {
        res.status(400).send({
            Message: "Please provide all required fields - first_name, last_name, password, email_address"
        });
    } else if (psw.length < 8){
        console.log("Password should be minimum of 8 characters...")
        res.status(400).send("Password should be minimum of 8 characters");
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
            }).catch(err => {
                console.log(err);
                res.status(400).end()
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
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                var data = {
                    id: user[0].id,
                    first_name: user[0].first_name,
                    last_name: user[0].last_name,
                    email_address: user[0].email_address,
                    createdAt: user[0].createdAt,
                    updatedAt: user[0].updatedAt
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
            console.log(err)
            res.status(400).end();
            // res.statusCode = 401
            // res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            // res.end('Unauthorized : Authentication error')

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
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
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
            console.log(err);
            res.status(400).end();
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
                if (amount_due < 0.01) {
                    res.status(400).send({
                        Message: "amount_due can not be less than 0.01"
                    });
                }
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
            console.log(err);
            res.status(400).end();
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
                }).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": "bill not found"
                    });
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
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
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                var owner_id = user[0].id
                Bill.findOne(
                    {
                        where: { id: req.params.id, owner_id: owner_id }
                    },//{include:[{model:File, as:file}]}, //{ include: [ {model:Metadata, as:metadata} ] },//{ include: [ Metadata ] }
                ).then(bill => res.status(200).json(bill)).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": "bill not found"
                    })
                })
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
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
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                var owner_id = user[0].id;
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
            console.log(err);
            res.status(400).end();
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
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                var owner_id = user[0].id
                Bill.destroy({
                    where: { id: req.params.id, owner_id: owner_id }
                }).then(function (result) {
                    res.status(204).end();
                }).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": "cannot delete bill"
                    });
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
        });
    };
});

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "/Users/vaibhavi/webapp/uploads"); //"./uploads"
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname + '-' + Date.now());
        console.log(file.originalname)
    }
});
const fileFilter = function (req, file, callback) {
    if (!file.originalname.match(/\.(png|jpeg|jpg|pdf)$/)) {
        console.log("only png/jpeg/jpg/pdf files are allowed");
        return callback(new Error('ERROR IN FILE FORMATE: ONLY png/jpeg/jpg/pdf FILES ARE ALLOWED'), false);
    }
    callback(null, true);
};

var upload = multer({ storage: storage, fileFilter: fileFilter })

// attach a file
app.post('/v1/bill/:id/file', upload.single('file'), (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                //console.log(req.files)
                if (!req.file) return res.send('Please upload a file')
                let file_name = req.file.originalname;
                let url = req.file.path;
                let size = req.file.size;
                let bill_id = req.params.id;
                let id = uuidv1();
                var today = new Date();
                let upload_date = today;
                //console.log(req.body)
                let data = { file_name, id, url, upload_date }

                Metadata.findOne(
                    { where: { bill_id: req.params.id } }
                ).then(result => {
                    if (result) {
                        res.status(400).send("First delete existing file")
                    } else {
                        Metadata.create({
                            file_name, id, url, upload_date, size, bill_id
                        }).then(metadata => {
                            File.create({
                                file_name, id, url, upload_date
                            }).then(file => res.end()).catch(err => {
                                console.log(err);
                                res.status(400).end()
                            });
                            res.status(201).json(data)
                            // File.create({
                            //     file_name, id, url, upload_date
                            // }).then(file => {
                            //     Metadata.create({
                            //         file_name, id, url, upload_date, size, bill_id
                            //     }).then(metadata => res.end()).catch(err => {
                            //         console.log(err);
                            //         res.status(400).end()
                            //     });
                            //     res.status(201).json(data)
                        }).catch(err => {
                            console.log(err);
                            res.status(400).end()
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    res.status(400).end()
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
        });
    };
});

// get a file
app.get('/v1/bill/:id/file/:id', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                File.findOne(
                    {
                        where: { id: req.params.id },
                    }
                ).then(file => res.status(200).json(file)).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": "file not found"
                    })
                })
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
        });
    };
});

// delete a file
app.delete('/v1/bill/:id/file/:id', (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Unauthorized : Authentication error')
    } else {
        var username = credentials.name;
        var password = credentials.pass;
        User.findAll({ where: { email_address: username } }).then(user => {
            var valid = true;
            valid = compare(username, user[0].email_address) && valid;
            valid = bcrypt.compareSync(password, user[0].password) && valid;
            if (valid) {
                File.findOne({ where: { id: req.params.id } }).then(function (file) {
                    const path = file.url;
                    fs.unlink(path, (err) => {
                        if (err) throw err;
                        console.log('successfully deleted from dir');
                        res.status(204).end();
                    });
                    File.destroy({
                        where: { id: req.params.id }
                    }).then(function (file) {
                        res.status(204).end();
                    }).catch(err => {
                        console.log(err);
                        res.status(404).json({
                            "message": "cannot delete from file"
                        });
                    });
                    Metadata.destroy({
                        where: { id: req.params.id }
                    }).then(function (file) {
                        res.end();
                    }).catch(err => {
                        console.log(err);
                        res.status(404).json({
                            "message": "cannot delete from metadata"
                        });
                    });
                }).catch(err => {
                    console.log(err);
                    res.status(404).json({
                        "message": "file not found"
                    });
                });
            } else {
                console.log("Authentication error")
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Unauthorized : Authentication error')
            }
        }).catch(function (err) {
            console.log(err);
            res.status(400).end();
        });
    };
});


const port = 3001
app.listen(port, () => {
    console.log("Running on port " + port);
});;

module.exports = app;

// app.post('/v1/bill/:id/file', (req, res) => {
// var upload = multer({ storage : storage}).single('file');
//     //global.appRoot = __dirname;
//     //const file = global.appRoot + '/uploads/' + req.file.filename;
//     upload(req,res,function(err) {
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         if (!req.file) return res.send('Please upload a file')
//         res.end("File is uploaded");
//     });
// });