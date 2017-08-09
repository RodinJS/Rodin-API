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
const Pages = new mongoose.Schema({

    slug: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    content: {
        type: Object,

    },

});

Pages.statics = {

    get(pageURL) {
        return this.findOne({ slug: pageURL, $or: [{ state: 'published' }, { state: 'draft' }] }).execAsync()
            .then((page) => {
                if (page) {
                    return page;
                }

                const err = new APIError('No such page exists!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            })
            .catch((e) => {
                console.log(e);
                const err = new APIError('No such page exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },

    getPagesList() {
        return this.find().select({ title: 1, slug: 1, state: 1, putOnFooter: 1, externalURL:1 })
            .then((pages) => {
                if (!pages) {
                    const err = new APIError('Error while requesting pages list!----', httpStatus.NOT_FOUND, true);
                    return Promise.reject(err);
                }
                return pages;

            })
            .catch((e)=> {
                const err = new APIError('Error while requesting pages list!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },

};

module.exports = mongoose.model('cms_pages', Pages);
