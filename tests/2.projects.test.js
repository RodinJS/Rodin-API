const request = require('supertest-as-promised');
const httpStatus = require('../common/httpStatus');
const chai = require('chai');
const expect = chai.expect;
//import {expect} from 'chai';
const app = require('../core/index');
const User = require('./utils/user');
const _ = require('lodash');

chai.config.includeStack = true;
describe('## Projects APIs', () => {

    let project = {
        blank: {
            displayName: 'testProject',
            name: 'testProject',
            tags: ['test'],
            description: 'test project description',
        },
        template: {
            displayName: 'testProjectTemplate',
            name: 'testProjectTemplate',
            tags: ['test', 'template'],
            description: 'test project with template',
        },
        hookRequest: {
            buildId: 4040,
            built: true,
        },
    };

    before(function (done) {
        User.login(() => {
            done();
        });
    });

    it('should create a new blank project', (done) => {
        request(app)
            .post('/api/project')
            .set(User.generateHeaders())
            .send(project.blank)
            .expect(httpStatus.CREATED)
            .then(res => {
                project.info = res.body.data;
                User.setProject(res.body.data);
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should throw error projectExist', (done) => {
        request(app)
            .post('/api/project')
            .set(User.generateHeaders())
            .send(project.blank)
            .expect(httpStatus.PROJECT_EXIST)
            .then(res => {
                expect(res.body.success).to.equal(false);
                done();
            });

    });

    it('should get projects list', (done) => {
        request(app)
            .get('/api/project')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                expect(res.body.data).to.be.an('array');
                done();
            });
    });

    it('should insert templates inside DB', (done) => {
        request(app)
            .get('/api/project/templates/importOnce')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                //project.info = res.body.data;
                expect(res.body.success).to.equal(true);
                done();
            });

    });

    it('should get templates list', (done) => {
        request(app)
            .get('/api/project/templates/list')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                //project.info = res.body.data;
                expect(res.body.success).to.equal(true);
                expect(res.body.data).to.be.an('array');
                project.templates = res.body.data;
                done();
            });

    });

    it('should create a new project with template', (done) => {
        project.template.templateId = project.templates[0]._id;
        request(app)
            .post('/api/project')
            .set(User.generateHeaders())
            .send(project.template)
            .expect(httpStatus.CREATED)
            .then(res => {
                project.templateInfo = res.body.data;
                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should get project with template data', (done) => {
        request(app)
            .get('/api/project/' + project.templateInfo._id + '')
            .set(User.generateHeaders())
            .send({projectSize: true})
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                expect(res.body.data._id).to.equal(project.templateInfo._id);
                done();
            });
    });

    /* it('should get tree project with template', (done) => {
     request(app)
     .get('/api/editor/' + project.templateInfo._id + '')
     .set(User.generateHeaders())
     .expect(httpStatus.OK)
     .then(res => {
     expect(res.body.success).to.equal(true);
     expect(res.body.data).to.be.an('object');
     expect(res.body.data.tree.children).to.exist;

     let files = _.map(res.body.data.tree.children, function (file) {
     return file.name;
     });

     expect(files[0]).to.equal('.gitignore');
     expect(files[1]).to.equal('index.html');
     done();
     });
     });*/

    it('should remove project with template data', (done) => {
        request(app)
            .delete(`/api/project/${project.templateInfo._id}`)
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should project set public', (done) => {
        request(app)
            .post(`/api/project/pp/${project.info._id}`)
            .send({status: 'true'})
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should project unset public', (done) => {
        request(app)
            .post(`/api/project/pp/${project.info._id}`)
            .send({status: 'false'})
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should publish project', (done) => {
        request(app)
            .post('/api/project/publish/' + project.info._id + '')
            .set(User.generateHeaders())
            .expect(httpStatus.OK)
            .then(res => {
                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should hook project build ios, vive, oculus, daydream, android', (done) => {

        const validDevices = ['oculus', 'vive', 'daydream', 'gearvr', 'ios', 'android'];
        for (let i = 0; i < validDevices.length; i++) {
            request(app)
                .post('/api/hooks/build/' + project.info._id + '/' + validDevices[i])
                .set(User.generateHookHeader())
                .send(project.hookRequest)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.success).to.equal(true);
                    expect(res.body.data).to.equal(project.info.name + ' ' + validDevices[i] + ' build complete');
                    if (i + 1 == validDevices.length) {
                        done();
                    }
                });
        }

    });

});
