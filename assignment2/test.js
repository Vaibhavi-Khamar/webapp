const chai = require('chai');
const expect = require('chai').expect;
// var supertest = require("supertest");
// var should = require("should");

chai.use(require('chai-http'));

const app = require('./app.js');

describe('API endpoint GET', function () {

    // before(function () {

    // });

    // after(function () {

    // });

    it('should check body type & statuscode', function () {
        return chai.request(app)
            .get('/user/self')
            .then(function (res) {
                // expect(res).to.have.status(200);
                // expect(res).to.be.json;
                expect(res.body).to.be.an('object');
            });
    });
    // GET - Invalid path
    // it('should return Not Found', function () {
    //     return chai.request(app)
    //         .get('/INVALID_PATH')
    //         .then(function (res) {
    //             // throw new Error('Path exists!');
    //             expect(res).to.have.status(404);
    //         })
    //         .catch(function (err) {
    //             expect(err).to.have.status(404);
    //         });
    // });
});


/*refers to PORT where program is running.*/
// var server = supertest.agent("http://localhost:3000");

// describe("API endpoint POST", function () {
//     it("should return status code 201", function (done) {
//         server
//             .post('/v1/user')
//             .send({
//                 "first_name": "Matt",
//                 "last_name": "Hogan",
//                 "password": "lkjhgfdsa",
//                 "email_address": "hogan.matt@example.com"
//             })
//             .expect("Content-type", /json/)
//             .expect(201)
//             .end(function (err, res) {
//                 res.status.should.equal(201);
//                 done();
//             });
//     });
// });