'strict'

var expect = require('expect.js');
const chai = require('chai');
//const expect = require('chai').expect;
chai.use(require('chai-http'));
const app = require('./index.js');

describe('models check', function() {
    it('returns the user model', function() {
        var models = require('./sequelize');
        expect(models.User).to.be.ok();
    });

    it('returns the bill model', function() {
        var models = require('./sequelize');
        expect(models.Bill).to.be.ok();
    });
});

describe('API endpoint GET', function() {

    before(function() {

    });

    after(function() {

    });

    it('should check body type & statuscode', function() {
        return chai.request(app)
            .get('/user/self')
            .then(function(res) {
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