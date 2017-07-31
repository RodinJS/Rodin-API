/**
 * Created by xgharibyan on 6/27/17.
 */


const Response = require('../../common/servicesResponses');
const apiSockets = require('./apiSocket');

function push(req){

    const data = {
        username:req.body.username,
        event:req.body.event,
        content:req.body
    };
    if(req.notification){
        Object.assign(data, {
            username:req.notification.username,
            event:req.notification.event,
            content:req.notification
        });
    }

    const activeUser = apiSockets.Service.io.findUser(data.username);

    if (activeUser) {
        apiSockets.Service.io.broadcastToRoom(data.username, data.event, data.content);
        return `Socket pushed to ${data.username}`;
    }
    else{
        return Response.onError(null, `${data.username} not connected to socket`, 400)
    }

}

module.exports = {
    push:push
};
