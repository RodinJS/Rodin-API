const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * Project Schema
 */
const assignedModulesSchema = new mongoose.Schema({

    moduleId: {
        type: ObjectId,
        required: true,
    },
    projectId: {
        type: ObjectId,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },

});

assignedModulesSchema.statics = {

    get(projectId) {
        return this.find({ projectId: mongoose.Types.ObjectId(projectId) }).execAsync()
          .then((module) => {
            if (module) {
                return module;
            } else {
                const err = new APIError('No such project exists!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            }
        })
          .catch((e) => {
            const err = new APIError('No such project exists!', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        });
    },

    delete(code) {

    },

};

module.exports = mongoose.model('AssignedModules', assignedModulesSchema);
