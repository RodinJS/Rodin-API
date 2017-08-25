/**
 * Created by xgharibyan on 8/22/17.
 */

const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * Menu Schema
 */
const Menus = new mongoose.Schema({

    slug: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    items: {
        type: Array,
        required: true,
    },

    state: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
    },
});

Menus.statics = {
    getMenusList() {
        return this.aggregate([
            {$match: {"state": "published"}},

            {$unwind: {path: "$items", "preserveNullAndEmptyArrays": true}},
            {
                $lookup: {
                    "from": "cms_menuitems",
                    "localField": "items",
                    "foreignField": "_id",
                    "as": "menuitem"
                }
            },
            {$unwind: {path: "$menuitem", "preserveNullAndEmptyArrays": true}},
            {
                $group: {
                    _id: "$_id",
                    slug: {"$first": "$slug"},
                    name: {"$first": "$name"},
                    href: {"$first": "$href"},
                    state: {"$first": "$state"},
                    position: {"$first": "$position"},
                    items: {"$push": "$items"},
                    menuitems: {"$push": "$menuitem"}
                }
            }
        ]).then(menus => {
            if (!menus) {
                const err = new APIError('Error while requesting menus list!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            }
            return menus;
        })
            .catch((e) => {
                const err = new APIError('Error while requesting pages list!----', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },
};

module.exports = mongoose.model('cms_menus', Menus);
