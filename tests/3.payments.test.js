const request = require('supertest-as-promised');
const httpStatus = require('../common/httpStatus');
const chai = require('chai');
const expect = chai.expect;
//import {expect} from 'chai';
const app = require('../core/index');
const User = require('./utils/user');
chai.config.includeStack = true;

describe('## Stripe payment APIs', () => {
    before( (done) => {

        User.login(() => {
            User.createStripeToken(()=>{
                done();
            });
        });

    });

    it('should create customer in stripe', (done) =>{
        request(app)
            .post('/api/payments/stripe/customer')
            .set(User.generateHeaders())
            .send({stripeToken:User.getStripeToken()})
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.data.stripe.customerId).to.be.a('string');
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should get customer from stripe', (done) =>{
        request(app)
            .get('/api/payments/stripe/customer')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.data.id).to.be.a('string');
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should create subscription in stripe', (done) =>{
        request(app)
            .post('/api/payments/stripe/subscription')
            .send({planId:'premium'})
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.data.stripe.subscriptionId).to.be.a('string');
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should get subscription from stripe', (done) =>{
        request(app)
            .get('/api/payments/stripe/subscription')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.data.id).to.be.a('string');
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should delete subscription from stripe', (done) =>{
        request(app)
            .delete('/api/payments/stripe/subscription')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should delete customer from stripe', (done) =>{
        request(app)
            .delete('/api/payments/stripe/customer')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                console.log('res.body.data.stripe', res.body.data.stripe);
                expect(res.body.data.stripe).to.be.an('undefined');
                expect(res.body.success).to.equal(true);
                done();
            });

    });
});
