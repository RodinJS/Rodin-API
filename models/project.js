const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('../common/httpStatus');
const APIError = require('../common/APIError');

/**
 * Project Schema
 */
const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    tags: [{
        type: String,
    },],
    thumbnail: {
        type: String,
    },
    templateOf: {
        type: String,
    },
    root: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
    },
    public: {
        type: String,
        default: 'false',
    },
    build: {
        oculus: {
            requested: {
                type: Boolean,
                default: false,
            },
            built: {
                type: Boolean,
                default: false,
            },
            buildId: String,
            version: String,
        },
        vive: {
            requested: {
                type: Boolean,
                default: false,
            },
            built: {
                type: Boolean,
                default: false,
            },
            buildId: String,
            version: String,
        },
        daydream: {
            requested: {
                type: Boolean,
                default: false,
            },
            built: {
                type: Boolean,
                default: false,
            },
            buildId: String,
            version: String,
        },
        gearvr: {
            type: Boolean,
            version: String,
        },
        ios: {
            requested: {
                type: Boolean,
                default: false,
            },
            built: {
                type: Boolean,
                default: false,
            },
            buildId: String,
            version: String,
        },
        android: {
            requested: {
                type: Boolean,
                default: false,
            },
            built: {
                type: Boolean,
                default: false,
            },
            buildId: String,
            version: String,
        },
    },
    github: {
        git: {type: String},
        https: {type: String},
    },
    githubUrl: {
        type: String,
    },
    domain: {
        type: String,
    },
    type: {
        type: String,
        enum: ['featured', 'demos'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    publishDate: {
        type: Date,
    },
    publishedPublic: {
        type: Boolean,
    },
    state: {
        type: String,
        default: "pending"
    },
    defaultThumbnail:{
        type:String,
    },
    developerKey: {
        "type": String
    }
});

/**
 * Statics
 */
ProjectSchema.statics = {
    /**
     * Get project by id
     * @param {ObjectId} id - The objectId of project.
     * @returns {Promise<User, APIError>}
     */
    get(param) {
        const queryParam = typeof param === 'string' ? {_id: param} : param;

        return this.findOne(queryParam)  //new RegExp('^' + id + '$', "i")
            .execAsync().then((project) => {
                if (project) {
                    return project;
                }
            })
            .error((e) => {
                const err = new APIError('No such project exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },
    /**
     * Get project by id
     * @param {String} name - The name of project.
     * @param {String} owner - The owner username of project.
     * @returns {Promise<User, APIError>}
     */
    getByName(name, owner) {
        let specialName = name.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        return this.findOne({name: specialName, owner: owner})  //new RegExp('^' + id + '$', "i")
            .execAsync().then((project) => {
                if (project) {
                    return project;
                }
            })
            .error((e) => {
                const err = new APIError('No such project exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },
    /**
     * Get project by id
     * @param {ObjectId} id - The objectId of project.
     * @returns {Promise<User, APIError>}
     */
    getOne(id, owner) {
        // console.log(`id: ${id}, owner: ${owner}`)
        let query = {
            $and: [
                {owner: owner},
                {
                    $or: [{root: id}],
                },
            ],
        };

        if (new RegExp('^[0-9a-fA-F]{24}$').test(id)) {
            query.$and[1].$or.push({_id: mongoose.Types.ObjectId(id)});
        }

        return this.findOne(query)  //new RegExp('^' + id + '$', "i")
            .execAsync().then((project) => {

                if (project) {
                    return project;
                } else {
                    const err = new APIError('No such project exists!----++', httpStatus.NOT_FOUND, true);
                    return Promise.reject(err);
                }
            })
            .error((e) => {
                const err = new APIError('No such project exists!', httpStatus.NOT_FOUND, true);
                return Promise.reject(err);
            });
    },

    /**
     * Get published project count based on searching criterias
     * @param owner
     * @param published
     * @param approved
     * @param type
     * @returns {*}
     */
    projectsCount(owner, published, approved, type = 'featured'){
        const query = {};
        if (owner) {
            query.owner = owner;
        }

        if (type) {
            query.type = type;
        }

        if (published) {
            query.$and = [
                {publishDate: {$exists: true}},
                {publishedPublic: {$eq: true}},
            ];
        }

        if (approved) {
            if (query.$and) {
                query.$and.push({state: 'approved'});
            }
            else {
                query.$and = [
                    {state: 'approved'}
                ]
            }
        }

        return this.find(query).count().execAsync();
    },

    /**
     * List projects in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of projects to be skipped.
     * @param {number} limit - Limit number of projects to be returned.
     * @returns {Promise<Project[]>}
     */
    list({skip = 0, limit = 50} = {}, owner, _queryString = null, published = false, approved = false, sort = 'recent', type) {
        const query = {};
        if (owner) {
            query.owner = owner;
        }

        if (_queryString) {
            _queryString = _queryString.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            const re = new RegExp(_queryString, 'gi');
            query.$or = [
                {
                    name: re,
                },
                {
                    displayName: re,
                },
                {
                    description: re,
                },
            ];
        }

        if (published) {
            query.$and = [
                {publishDate: {$exists: true}},
                {publishedPublic: {$eq: true}},
            ];
        }

        if (approved) {
            if (query.$and) {
                query.$and.push({state: 'approved'});
            }
            else {
                query.$and = [
                    {state: 'approved'}
                ]
            }
        }

        if (type) {
            query.type = type;
        }

        let sortBy = {};
        if (sort == 'az') { //RO-882 # fix for production app
            sortBy = {name: 1};
        } else if (sort == 'popular') {
            sortBy = {createdAt: -1};
        } else {
            sortBy = {createdAt: -1};
        }

        return this.find(query)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .execAsync();
    },
};

ProjectSchema.pre('save', function (next) {
    let project = this;

    function generateProjectRoot(i, callback) {
        if (i !== 0) {
            project.root += i;
        } else {
            let specialName = project.name.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            project.name = specialName;
            project.root = specialName;
        }

        project.constructor.count({root: project.root, owner: project.owner}, (err, count) => {
            if (err) {
                return callback(err);
            } else if (count > 0) {
                return generateProjectRoot(++i, callback);
            }

            return callback();
        });
    }

    if (project.isNew) {
        return generateProjectRoot(0, next);
    } else {
        return next();
    }
});

ProjectSchema.methods.outcome = function () {
    let project = this;
    return {
        _id: project._id,
        name: project.name,
        owner: project.owner,
        root: project.root,
        picture: project.picture,
        displayName: project.displayName,
    };
};


/**
 * @typedef Project
 */
module.exports = mongoose.model('Project', ProjectSchema);
