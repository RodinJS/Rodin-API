/**
 * Created by xgharibyan on 8/9/17.
 */

const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * Project Schema
 */
const Landing = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    publishedDate: {
        type: Object,

    },

});

Landing.statics = {

    get() {
        return this.findOne({}, {}, { sort: { 'publishedDate' : -1 } })
            .then(landing=>{
                if(landing) return landing;
                const err = new APIError('No such page exists!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            })
            .catch((e)=>{
                console.log(e);
                const err = new APIError('No such page exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err)
            })
    }

};

module.exports = mongoose.model('cms_landing', Landing);
