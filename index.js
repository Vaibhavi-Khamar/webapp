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
const path = require('path');

const aws = require('aws-sdk');
const multerS3 = require('multer-s3');

const BUCKET_NAME = process.env.S3BUCKET_NAME;
// const BUCKET_NAME = '';
// const ACCESSKEYID = '';
// const SECRETACCESSKEY = '';

app.use(bodyParser.json())

const winston = require('winston');
var logger = new winston.createLogger({
    level: 'info',
    transports: [
        new (winston.transports.Console)(),
        new winston.transports.File({
            timestamp: true,
            name: "cloudwatch_log_stream",
            filename: path.resolve(__dirname, "logs/csye6225.log"),
            json: true
        })
    ]
});

var SDC = require('statsd-client'),
    sdc = new SDC({host: 'statsd.example.com', port: 8125});

//----------------------------------------- Create user -----------------------------------------//
app.post('/v1/user', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('USER_POST counter');

    let psw = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email_address = req.body.email_address;
    if (!first_name || !last_name || !psw || !email_address) {
        res.status(400).send({
            Message: "Please provide all required fields - first_name, last_name, password, email_address"
        });
    } else if (psw.length < 8) {
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
                    logger.info ("User already registered")
                    res.status(400).send("User already registered")
                } else {
                    User.create({
                        id, first_name: req.body.first_name, last_name: req.body.last_name, password: hash, email_address: req.body.email_address, createdAt, updatedAt
                    }).then(user => {
                        logger.info ("User created"+data)
                        console.log(data)
                        res.status(201).json(data)
                    }).catch(err => {
                        logger.error ("Error in create user"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("USER_POST Time Duration",duration);
})


//----------------------------------------- get user -----------------------------------------//
app.get('/v1/user/self', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('USER_GET counter');

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
                logger.info ("GET USER successful"+data)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("USER_GET Time Duration",duration);
});

//----------------------------------------- update user -----------------------------------------//
app.put('/v1/user/self', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('USER_PUT counter');

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
                        }).then(user => {
                            logger.info ("User updated")
                            res.status(204).end()
                        }).catch(err => {
                            logger.error ("Error in updating user"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("USER_PUT Time Duration",duration);
});

//----------------------------------------- create bill -----------------------------------------//
app.post('/v1/bill', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('BILL_POST counter');

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
                        id, vendor, owner_id, bill_date, due_date, amount_due, categories, payment_status, createdAt, updatedAt
                    }).then(bill => {
                        //Bill.update({ owner_id }, { where: { id: id } }).then(bill => res.end())
                        logger.info ("Bill created"+data)
                        console.log(data)
                        res.status(201).json(data)
                    }).catch(err => {
                        logger.error ("Create bill failed"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("BILL_POST Time Duration",duration);
});


// get bills
app.get('/v1/bills', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('BILL_GET counter');

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
                    logger.info ("GET BILL succcessful"+bill)
                    return res.status(200).json(bill)
                }).catch(err => {
                    logger.info ("Bill not found"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("BILL_GET Time Duration",duration);
});

//----------------------------------------- get bill by id -----------------------------------------//
app.get('/v1/bill/:id', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('BILL_GET_BY_ID counter');

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
                    },//{include:[{model:File}]}//{include:[{model:File, as:'file'}]}, //{ include: [ {model:Metadata, as:metadata} ] },//{ include: [ Metadata ] }
                ).then(bill => {
                    logger.info ("GET BILL by ID succcessful"+bill)
                    res.status(200).json(bill)
                }).catch(err => {
                    logger.info ("Bill not found"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("BILL_GET_BY_ID Time Duration",duration);
});

//----------------------------------------- update bill by id -----------------------------------------//
app.put('/v1/bill/:id', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('BILL_PUT counter');

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
                }).then(bill => {
                    logger.info ("BILL UPDATE succcessful"+data)
                    res.status(200).json(data)
                }).catch(err => {
                    logger.info ("BILL UPDATE failed"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("BILL_PUT Time Duration",duration);
});

//----------------------------------------- delete bill -----------------------------------------//
app.delete('/v1/bill/:id', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('BILL_DELETE counter');

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

                Metadata.findOne(
                    {
                        where: { bill_id: req.params.id },
                    }
                ).then(metadata => {

                    var userFolder = req.params.id + '/' + metadata.file_name;

                    const s3 = new aws.S3({
                        // accessKeyId: ACCESSKEYID,
                        // secretAccessKey: SECRETACCESSKEY,
                        Bucket: BUCKET_NAME,
                    });

                    var params = {
                        Bucket: BUCKET_NAME,
                        Key: userFolder,
                    }

                    s3.deleteObject(params, function (err, data) {
                        if (err) {
                            console.log("s3 delete failed")
                            console.log(err, err.stack); // an error occurred

                        } else {
                            console.log(data); // successful
                        }
                    });

                    var path1 = metadata.url;
                    fs.unlink(path1, (err) => {
                        if (err) throw err;
                        console.log('successfully deleted from dir');
                        res.status(204).end();
                    });

                    var file_id = metadata.id;
                    console.log('fileid is' + file_id)
                    File.destroy({
                        where: { id: file_id }
                    }).then(function (file) {
                        res.status(204).end();
                    }).catch(err => {
                        console.log(err);
                        res.status(404).json({
                            "message": "cannot delete from file"
                        });
                    });

                    Metadata.destroy({
                        where: { bill_id: req.params.id }
                    }).then(function (meta) {
                        res.end();
                    }).catch(err => {
                        console.log(err);
                        res.status(404).json({
                            "message": "cannot delete from metadata"
                        });
                    });

                    var owner_id = user[0].id
                    Bill.destroy({
                        where: { id: req.params.id, owner_id: owner_id }
                    }).then(function (result) {
                        logger.info ("bill deleted")
                        res.status(204).end();
                    }).catch(err => {
                        logger.info ("BILL DELETE failed"+err)
                        console.log(err);
                        res.status(404).json({
                            "message": "cannot delete bill"
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("BILL_DELETE Time Duration",duration);
});


// var params = multerS3({
//     s3: s3,
//     bucket: BUCKET_NAME,
//     // metadata: function (req, file, cb) {
//     //     cb(null, { fieldName: file.fieldname });
//     // },
//     key: function (req, file, callback) {
//         console.log(file)
//         callback(null, file.originalname + '-' + Date.now())
//         console.log(file.originalname + '-' + Date.now())
//     }
// });

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./uploads"); //Users/vaibhavi/webapp/uploads"
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
        //callback(null, false);
    }
    callback(null, true);
};

var upload = multer({ storage: storage, fileFilter: fileFilter, preservePath: true }).single('file');
//var uploads3 = multer({ storage: params, fileFilter: fileFilter }).single('file');

//----------------------------------------- attach a file -----------------------------------------//
app.post('/v1/bill/:id/file', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('FILE_POST counter');

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

                Metadata.findOne(
                    { where: { bill_id: req.params.id } }
                ).then(result => {
                    if (result) {
                        res.status(400).send("First delete existing file")
                    } else {
                        upload(req, res, function (err) {
                            if (err) {
                                return res.end("Error uploading file.");
                            } else {
                                //console.log(req.files)
                                if (!req.file) return res.send('Please upload a file')
                                let file_name = req.file.originalname;
                                let url = req.file.path;
                                let size = req.file.size;
                                let bill_id = req.params.id;
                                let id = uuidv1();
                                var today = new Date();
                                let upload_date = today;
                                var userFolder = req.params.id + '/' + req.file.originalname;

                                const s3 = new aws.S3({
                                    // accessKeyId: ACCESSKEYID,
                                    // secretAccessKey: SECRETACCESSKEY,
                                    Bucket: BUCKET_NAME,
                                });

                                var params = {
                                    Bucket: BUCKET_NAME,
                                    Key: userFolder,
                                    Body: req.file.path
                                }

                                s3.upload(params, function (err, data) {
                                    if (err) {
                                        console.log('error in callback');
                                        console.log(err);
                                    }
                                    console.log('success');
                                    console.log(data);
                                    var location = data.Location;
                                    let data1 = { file_name, id, location, upload_date }
                                    Metadata.create({
                                        file_name, id, url, upload_date, size, bill_id
                                    }).then(metadata => {
                                        File.create({
                                            file_name, id, url, upload_date
                                        }).then(file => res.end()).catch(err => {
                                            console.log(err);
                                            res.status(400).end()
                                        });
                                        console.log(data1)
                                        res.status(201).json(data1)
                                    }).catch(err => {
                                        console.log(err);
                                        res.status(400).end()
                                    });
                                });

                                // let data1 = { file_name, id, url, upload_date }
                                //     Metadata.create({
                                //         file_name, id, url, upload_date, size, bill_id
                                //     }).then(metadata => {
                                //         File.create({
                                //             file_name, id, url, upload_date
                                //         }).then(file => res.end()).catch(err => {
                                //             console.log(err);
                                //             res.status(400).end()
                                //         });
                                //         res.status(201).json(data1)
                                //     }).catch(err => {
                                //         console.log(err);
                                //         res.status(400).end()
                                //     });
                            }
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("FILE_POST Time Duration",duration);
});

//----------------------------------------- get a file -----------------------------------------//
app.get('/v1/bill/:id/file/:id', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('FILE_GET counter');

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
                ).then(file => {
                    logger.info ("GET FILE successful"+file)
                    res.status(200).json(file)
                }).catch(err => {
                    logger.error ("GET FILE failed"+err)
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("FILE_GET Time Duration",duration);
});

//----------------------------------------- delete a file -----------------------------------------//
app.delete('/v1/bill/:billid/file/:id', (req, res) => {
    var date = new Date();
    var startTime = date.getMilliseconds();
    sdc.increment('FILE_DELETE counter');

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
                    var userFolder = req.params.billid + '/' + file.file_name;

                    const s3 = new aws.S3({
                        // accessKeyId: ACCESSKEYID,
                        // secretAccessKey: SECRETACCESSKEY,
                        Bucket: BUCKET_NAME,
                    });

                    var params = {
                        Bucket: BUCKET_NAME,
                        Key: userFolder,
                    }

                    s3.deleteObject(params, function (err, data) {
                        if (err) {
                            console.log("s3 delete faild")
                            console.log(err, err.stack); // an error occurred

                        } else {
                            console.log(data); // successful
                        }
                    });

                    const path2 = file.url;
                    fs.unlink(path2, (err) => {
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
    var endTime = date.getMilliseconds();
    var duration = (endTime-startTime);
    sdc.timing("FILE_DELETE Time Duration",duration);
});


const port = 3001
app.listen(port, () => {
    console.log("Running on port " + port);
});;

module.exports = app;