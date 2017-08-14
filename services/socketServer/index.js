/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose =  require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const server = require('http').createServer();
const apiSocket = require('./apiSocket');
server.listen(config.socketPort);
apiSocket.run(server);



// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const socketServerResponder = new cote.Responder({
    name: 'socketServer responder',
    namespace: 'socketServer',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


socketServerResponder.on('hook', (req, cb) => {
    const response = Ctrl.push(req);
    cb((typeof response === 'string' ? null : response), (typeof response === 'string' ? response : null));
});
