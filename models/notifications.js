const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

const Mixed = mongoose.Schema.Types.Mixed;
const ObjectID = mongoose.Schema.Types.ObjectId;

/**
 * Notifications Schema
 */
const NotificationsSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    label: {
        type: String,
    },
    error: {
        type: Mixed,
    },
    project: {
        type: Object,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

NotificationsSchema.statics = {

    getOne(id) {
        return this.findOne({ _id: id })  //new RegExp('^' + id + '$', "i")
          .execAsync().then((project) => {
            if (project) {
                return project;
            } else {
                const err = new APIError('No such notification exists!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            }
        })
          .error((e) => {
            const err = new APIError('No such notification exists!', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        });
    },

    list({ skip = 0, limit = 50 } = {}, username) {
        return this.find({ username: username })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .execAsync();
    },
};

module.exports = mongoose.model('Notifications', NotificationsSchema);
