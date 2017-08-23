const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

const Mixed = mongoose.Schema.Types.Mixed;
const ObjectID = mongoose.Schema.Types.ObjectId;

/**
 * Notifications Schema
 */
const HelpScoutSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    conversationId: {
        type: Number,
        required: true
    },
    vote: {
        type: Number,
        required: true,
    }
});

HelpScoutSchema.statics = {

    get(username, conversationId) {
        return this.findOne({username: username, conversationId: conversationId})  //new RegExp('^' + id + '$', "i")
            .execAsync().then((vote) => vote)
            .catch((e) => {
                console.log(e);
                const err = new APIError('No such vote exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },
    list(username){
        return this.find({username:username}).select({vote:1, conversationId:1, _id:0})
            .execAsync().then((votes) => votes)
            .catch((e) => {
                console.log(e);
                const err = new APIError('No such vote exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    }
};

module.exports = mongoose.model('helpscoutvote', HelpScoutSchema);
