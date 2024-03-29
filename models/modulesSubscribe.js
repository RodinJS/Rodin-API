const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * Project Schema
 */
const subscribedModules = new mongoose.Schema({
    moduleId: {
        type: ObjectId,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    subscribedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    unsubscribed: {
        type: Boolean,
    },
    unsubscrbedDate: {
        type: Date,
    },
    expiredAt: {
        type: Date,
        default: (Date.now() + 2629746000), //currentDate + one month
        required: true,
    },

});

subscribedModules.statics = {
    getModuleByIdAndOwner(moduleId, owner) {
        return this.findOne({ owner: owner, moduleId: moduleId })
          .then(module => {
            if (!module) {
                const err = new APIError('Module not found', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            }

            return module;
        })
          .catch(e=> {
            const err = new APIError('Module not found', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        });
    },

    getByOwnerAndModuleId(owner, moduleId) {
        return this.findOne({ owner: owner, moduleId: mongoose.Types.ObjectId(moduleId) }).execAsync()
          .then((modules) => {
            if (modules) {
                return modules;
            } else {
                const err = new APIError('User dont have subscribed modules!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            }
        })
          .catch((e) => {
            const err = new APIError('User dont have subscribed modules!', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        });
    },

    getByOwner(owner) {
        return this.find({ owner: owner })
          .then((modules) => {
            if (modules) {
                return modules;
            }

            const err = new APIError('User dont have subscribed modules!----', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        })
          .catch((e) => {
            const err = new APIError('User dont have subscribed modules!', httpStatus.NOT_FOUND, true);
            return Promise.reject(err);
        });
    },

    delete(moduleId) {
      this.findByIdAndRemove(moduleId)
        .then(removedModule => removedModule)
        .catch((e)=>{
          const err = new APIError('User dont have subscribed modules!', httpStatus.NOT_FOUND, true);
          return Promise.reject(err);
        })
    },

};

module.exports = mongoose.model('SubscribedModules', subscribedModules);
