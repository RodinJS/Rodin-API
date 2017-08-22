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
const modulesRoute = require('./modules');
const socketServerRoute = require('./socketServer');
const notificationsRoute = require('./notifications');
const menusRoute = require('./menus');

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
        module: [RodinSanitizer.makeSanitize, modulesRoute],
    },
    notifications: {
        route: '/notifications',
        module: [RodinSanitizer.makeSanitize, notificationsRoute],
    },
    socketServer:{
        route:'/socket-server',
        module:[RodinSanitizer.makeSanitize, socketServerRoute]
    },
    menus: {
        route: '/menus',
        module: [menusRoute],
    },

};

_.each(apiRoutes, (route, key) => {
    router.use(route.route, route.module);
});

module.exports = router;

