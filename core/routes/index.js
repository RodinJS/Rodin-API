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
const paymentsRoutes = require('./payments');
const editorRoutes = require('./editor');
const supportRoutes = require('./support');
const pagesRoutes = require('./pages');
const modulesRoutes = require('./modules');
const socketServerRoutes = require('./socketServer');
const notificationsRoutes = require('./notifications');
const customDomainRoutes = require('./customDomain');
const menusRoutes = require('./menus');

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
    customDomain: {
        route: '/domains',
        module: [RodinSanitizer.makeSanitize, customDomainRoutes],
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
    payments: {
        route: '/payments',
        module: [RodinSanitizer.makeSanitize, paymentsRoutes],
    },
    editor: {
        route: '/editor',
        module: [editorRoutes],
    },
    support: {
        route: '/support',
        module: [supportRoutes],
    },
    pagesRoutes:{
        route:'/pages',
        module:[pagesRoutes]
    },
    modules: {
        route: '/modules',
        module: [RodinSanitizer.makeSanitize, modulesRoutes],
    },
    notifications: {
        route: '/notifications',
        module: [RodinSanitizer.makeSanitize, notificationsRoutes],
    },
    socketServer:{
        route:'/socket-server',
        module:[RodinSanitizer.makeSanitize, socketServerRoutes]
    },
    menus: {
        route: '/menus',
        module: [menusRoutes],
    },
};

_.each(apiRoutes, (route, key) => {
    router.use(route.route, route.module);
});

module.exports = router;

