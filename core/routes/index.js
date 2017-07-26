/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const _ = require('lodash');
const RodinSanitizer = require('../../common/sanitizer');

const authRoutes = require('./auth');
const userRoutes = require('./user');
const projectRoutes = require('./project');
const hooksRoutes = require('./hooks');
const gitRoutes = require('./git');

const router = express.Router();

const apiRoutes = {
    auth: {
        route: '/auth',
        module: [RodinSanitizer.makeSanitize, authRoutes],
    },
    user: {
        route: '/user',
        module: [RodinSanitizer.makeSanitize, userRoutes],
    },
    project: {
        route: '/project',
        module: [RodinSanitizer.makeSanitize, projectRoutes],
    },
    hooks: {
        route: '/hooks',
        module: [RodinSanitizer.makeSanitize, hooksRoutes],
    },
    git: {
        route: '/git',
        module: [RodinSanitizer.makeSanitize, gitRoutes],
    },
};

_.each(apiRoutes, (route, key) => {
    router.use(route.route, route.module);
});

module.exports = router;

