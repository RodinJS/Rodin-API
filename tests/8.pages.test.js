/**
 * Created by xgharibyan on 8/9/17.
 */

const request = require('supertest-as-promised');
const httpStatus = require('../common/httpStatus');
const chai = require('chai');
const expect = chai.expect;
//import {expect} from 'chai';
const app = require('../core/index');
const User = require('./utils/user');
const Helpers = require('./utils/helpers');
const _ = require('lodash');


describe('## PAGES APIs ', () => {
    let categoryId = false;
    let articleId = false;

    it('should get knwoledgebase categories list form HelpScout', (done) => {
        request(app)
            .get('/api/pages/support/knowledgebase/categories')
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                expect(res.body.data).to.be.an('array');
                categoryId = res.body.data[0].id;
                done();
            });
    })

    it('should get category articles list form HelpScout', (done) => {
        request(app)
            .get(`/api/pages/support/knowledgebase/articles/${categoryId}`)
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                expect(res.body.data).to.be.an('array');
                articleId = res.body.data[0].id;
                done();
            });
    });

    it('should get single article from Help Scout', (done) => {
        request(app)
            .get(`/api/pages/support/knowledgebase/article/${articleId}`)
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                expect(res.body.data).to.be.an('object');
                done();
            });
    })

});
