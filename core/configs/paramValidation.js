/**
 * Created by xgharibyan on 6/27/17.
 */


const Joi = require('joi');

module.exports = {
    // POST /api/users
    createUser: {
        body: {
            email: Joi.string().required(),
            username: Joi.string().required(),
            password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[^]{8,}$/).required().label('Password').options({
                language: {
                    any: {
                        empty: 'is not allowed to be empty',
                    },
                    string: {
                        regex: {
                            base: 'must be at least 8 characters long, contain a number and letter',
                            name: 'with value "{{!value}}" fails to match the {{name}} pattern',
                        },
                    },
                },
            }),
        },
    },

    // UPDATE /api/users/:userId
    updateUser: {
        options: {
            allowUnknownBody: false,
        },
        body: {
            email: Joi.string().optional(),
            username: Joi.string().optional(),
            notification: Joi.boolean().optional(),
            profile: {
                firstName: Joi.string().optional().allow(''),
                lastName: Joi.string().optional().allow(''),
                city: Joi.string().optional().allow(''),
                about: Joi.string().optional().allow(''),
                website: Joi.string().optional().allow(''),
                skills: Joi.array().optional().allow([]),
            },
            editorSettings: {
                theme: {
                    name: Joi.string().optional(),
                },
            },
        },
    },

    // UPDATE /api/users/:userId/password
    updatePassword: {
        options: {
            allowUnknownBody: false,
        },
        body: {
            password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[^]{8,}$/).required().label('Password').options({
                language: {
                    any: {
                        empty: 'is not allowed to be empty',
                    },
                    string: {
                        regex: {
                            base: 'must be at least 8 characters long, contain a number and letter',
                            name: 'with value "{{!value}}" fails to match the {{name}} pattern',
                        },
                    },
                },
            }),
            confirmPassword: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[^]{8,}$/).required().options({
                language: {
                    any: {
                        empty: 'is not allowed to be empty',
                    },
                    string: {
                        regex: {
                            base: 'must be at least 8 characters long, contain a number and letter',
                            name: 'with value "{{!value}}" fails to match the {{name}} pattern',
                        },
                    },
                },
            }),
            token: Joi.string().optional().allow('')
        },
    },


    // POST /api/project
    createProject: {
        body: {
            displayName: Joi.string().max(128).required().label('Project name'),
            name: Joi.string().regex(/^[A-Za-z0-9?,_-]+$/).required().label('Project URL').options({
                language: {
                    any: {
                        empty: 'is not allowed to be empty',
                    },
                    string: {
                        regex: {
                            base: 'should be alphanumeric and no spaces',
                            name: 'with value "{{!value}}" fails to match the {{name}} pattern',
                        },
                    },
                },
            }),
            description: Joi.string().max(128).required(),
            tags: Joi.array().optional(),
            templateId: Joi.string().optional(),
        },
    },

    // UPDATE /api/project/:projectId
    updateProject: {
        options: {
            allowUnknownBody: false,
        },
        body: {
            displayName: Joi.string().max(128).required().label('Project name'),
            name: Joi.string().regex(/^[A-Za-z0-9?,_-]+$/).required().label('register_tel').label('Project URL').options({
                language: {
                    any: {
                        empty: 'is not allowed to be empty',
                    },
                    string: {
                        regex: {
                            base: 'should be alphanumeric and no spaces',
                            name: 'with value "{{!value}}" fails to match the {{name}} pattern',
                        },
                    },
                },
            }),
            description: Joi.string().max(128).required(),
            tags: Joi.array().optional(),
            domain: Joi.string().optional().allow(''),
            url: Joi.string().optional().allow(''),
            thumbnail: Joi.string().optional().allow(''),
            public: Joi.boolean().optional(),
        },
        // params: {
        //   projectId: Joi.string().hex().required()
        // }
    },

    // POST /api/auth/login
    login: {
        body: {
            username: Joi.string().required(),
            password: Joi.string().required(),
        },
    },


    createCustomer: {
        body: {
            cardNumber: Joi.string().required(),
            city: Joi.string().required(),
            country: Joi.string().required(),
            expireDate: Joi.string().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            postalCode: Joi.string().required(),
            securityCode: Joi.string().required(),
        },
    },

    upgradeSubscription: {
        body: {
            card: {
                cardNumber: Joi.number().required(),
                city: Joi.string().required(),
                country: Joi.string().required(),
                expireDate: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                postalCode: Joi.string().required(),
                securityCode: Joi.string().required(),
            },
            planId: Joi.string().required()
        }
    }
};


// regEx:  ^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8}$
// ^                         Start anchor
// (?=.*[A-Z].*[A-Z])        Ensure string has two uppercase letters.
// (?=.*[!@#$&*])            Ensure string has one special case letter.
// (?=.*[0-9].*[0-9])        Ensure string has two digits.
// (?=.*[a-z].*[a-z].*[a-z]) Ensure string has three lowercase letters.
// .{8}                      Ensure string is of length 8.
// $                         End anchor.
// .regex(/^[1-9][0-9]{9}$/).
