/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose =  require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const userCapacity = require('../../common/directorySize');
const ProjectsHelper = require('../../common/Projects');

// connect to mongo db
/*Promise.promisifyAll(mongoose);
mongoose.connect(config.db, {
    useMongoClient:true,
    keepAlive:1,
});
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database (Auth responder): ${config.db}`);
});*/

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const authResponder = new cote.Responder({
    name: 'authorization responder',
    namespace: 'auth',
    respondsTo: ['list']
});

//authResponder.on('*', console.log);


authResponder.on('login', (req, cb) => {
    const data = {};
    Ctrl.login(req.body)
        .then(user=>{
            Object.assign(data, {user:user});
            return userCapacity.getUserStorageSize(data.user);
        })
        .then(storageSize=>{
            Object.assign(data, {usedStorage:storageSize});
            return ProjectsHelper.count(data.user);
        })
        .then(count =>{
            Object.assign(data, {projectsCount:count});
            return cb(null, Ctrl.completeLogin(data))
        })
        .catch(err=> cb(err, null));
});

authResponder.on('socialAuth', (req, cb)=>{
    Ctrl.socialAuth(req)
        .then(user=> cb(null, Ctrl.completeLogin({user:user})))
        .catch(err => cb(err, null))
});