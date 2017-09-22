/**
 * Created by xgharibyan on 6/27/17.
 */
const _ = require('lodash');
const Promise = require('bluebird');
const APIError = require('../../common/APIError');
const httpStatus = require('../../common/httpStatus');
const Response = require('../../common/servicesResponses');
const HelpScoutVote = require('../../models/helpScoutVote');
const Q = require('q');
const helpscout = require('helpscout');
const request = require('request');
const apiKey = '19796176812c0a05720d4c046949abbbc335d950';
const mailboxes = {
    'Q&A': {
        id: 116708,
        name: 'Q&A',
        voteId: 3774
    },
    'issues': {
        id: 116974,
        name: 'issues',
        voteId: 3775
    },
    'features': {
        id: 116976,
        name: 'features',
        voteId: 3776
    }
};
const defaultParams = {
    headers: {
        'Content-Type': 'application/json'
    },
    json: true,
    auth: {
        'user': apiKey,
        'pass': 'X'
    },
};

const mappers = {
    pickerParams: ['id', 'threadCount', 'subject', 'status', 'preview', 'createdAt', 'modifiedAt', 'user', 'tags', 'threads', 'rating', 'myThreadId'],

    conversation(data) {
        return new Promise((resolve, reject) => {
            Q.all(_.map(data.items, (conversation, key) => {
                const options = {
                    url: `https://api.helpscout.net/v1/conversations/${conversation.id}.json`,
                    method: 'GET',
                };
                Object.assign(options, defaultParams);
                return _submit(options);
            }))
                .then(responses => {
                    const items = _.map(responses, (data) => this.singleConversation(data.item, false.username));
                    data.items = _.sortBy(items, (item) => -new Date(item.createdAt));
                    return resolve(data);
                })
                .catch(err => reject(err));
        })
    },

    singleConversation(conversation, getThreads = true) {
        let pickerParams = _.clone(this.pickerParams);
        conversation.threads = _.sortBy(_.map(conversation.threads, (thread, key) => {
            thread.createdBy = _.pick(thread.createdBy, ['firstName', 'lastName', 'email', 'photoUrl']);
            thread = _.pick(thread, ['body', 'createdBy', 'createdAt', 'id']);
            return thread;
        }), (thread)=> new Date(thread.createdAtxw));
        conversation.preview = _.last(conversation.threads).body;
        conversation.myThreadId = _.last(conversation.threads).id;

        if (!getThreads) {
            pickerParams = _.remove(pickerParams, (param) => param !== 'threads');
        }
        else {
            conversation.threads.pop();
        }
        conversation.rating = conversation.customFields[0] ? parseInt(conversation.customFields[0].value) : 0;
        conversation.user = _.pick(conversation.customer, ['firstName', 'lastName', 'email', 'photoUrl']);
        conversation = _.pick(conversation, pickerParams);
        return conversation;
    },

    mergeVotes(votes, conversations) {
        if (!votes || votes.length <= 0) return conversations;
        if (conversations.items) {
            conversations.items = _.map(conversations.items, (conversation) => {
                const vote = _.find(votes, (vote) => vote.conversationId == conversation.id);
                Object.assign(conversation, {voted: vote});
                return conversation;
            });
        }
        else {
            const vote = _.find(votes, (vote) => vote.conversationId == conversations.id);
            Object.assign(conversations, {voted: vote});
        }
        return conversations;
    }

};

function _initThread(req) {
    const customer = {
        id: req.hsUser.id,
        email: req.hsUser.emails[0],
        type: "customer",
    };
    return {
        type: "customer",
        createdBy: customer,
        body: req.body.description,
        status: "active",
        createdAt: new Date()
    }
}

function _initThreadParams(method, req) {
    const data = {
        url: `https://api.helpscout.net/v1/conversations/${req.params.conversationId}.json`,
        method: method,
        body: _initThread(req)
    };
    Object.assign(data, defaultParams);
    return data;
}

function _initUpdateThread(req) {
    const data = {
        url: `https://api.helpscout.net/v1/conversations/${req.params.conversationId}/threads/${req.body.threadId}.json`,
        method: 'PUT',
        body: {
            body: req.body.description
        }
    };
    Object.assign(data, defaultParams);
    return data;
}

function _initConversationParams(method, req, mailbox) {
    const customer = {
        id: req.hsUser.id,
        email: req.hsUser.emails[0],
        type: "customer",
    };
    const data = {
        url: 'https://api.helpscout.net/v1/conversations.json',
        method: method,

        body: {
            customer: customer,
            mailbox: mailbox,
            subject: req.body.subject,
            status: "active",
            createdAt: new Date(),
            tags: req.body.tags,
            threads: [],
            customFields: []
        }
    };
    data.body.threads.push(_initThread(req));
    data.body.customFields.push({
        fieldId: mailbox.voteId,
        value: 0,
        name: 'vote',
    });
    Object.assign(data, defaultParams);
    return data;

}

function _initConversationListParams(mailbox) {
    const options = {
        url: `https://api.helpscout.net/v1/mailboxes/${mailbox}/conversations.json`,
        method: 'GET',
        qs: {
            status: 'active'
        }
    };
    Object.assign(options, defaultParams);
    return options;
}

function _initCustomerSearchParams(req) {
    const data = {
        url: 'https://api.helpscout.net/v1/search/customers.json',
        method: 'GET',
        qs: {
            query: req.user.email
        }
    };
    Object.assign(data, defaultParams);
    return data;
}

function _initSearchParams(req) {
    let mailboxId = 0;
    switch (req.params.type) {
        case 'issues':
            mailboxId = mailboxes['issues'].id;
            break;
        case 'features':
            mailboxId = mailboxes['features'].id;
            break;
        default:
            mailboxId = mailboxes['Q&A'].id;
    }
    const data = {
        url: 'https://api.helpscout.net/v1/search/conversations.json',
        method: 'GET',
        qs: {
            query: `mailboxid:${mailboxId}`,
            pageSize: req.query.limit || 10,
            page: req.query.page || 1,
            sortField:'modifiedAt',
            sortOrder: 'desc'
        }
    };
    if (req.query.subject) data.qs.query += ` AND subject:"${req.query.subject}"`;
    if (req.query.tags) {
        data.qs.query += ` AND ${req.query.tags.map((date) => `tag:"${date}" `).join(" OR ")}`
    }
    Object.assign(data, defaultParams);
    return data;
}

function _initCustomerParams(method, req) {
    const data = {
        url: 'https://api.helpscout.net/v1/customers.json',
        method: method,

        body: {
            "firstName": req.user.username,
            "lastName":req.user.username,
            "emails": [{
                "value": req.user.email
            }]
        }
    };
    Object.assign(data, defaultParams);
    return data;
}

function _grabTags(data) {
    const allTags = _.chain(data)
        .reduce((acc, val, key) => {
            acc = _.concat(acc, val.tags);
            return acc;
        }, [])
        .groupBy('length')
        .map((items, name) => ({name: items[0], count: items.length}))
        .sortBy("count")
        .reverse()
        .value();


    return allTags.splice(0, 8);
}

function _submit(options) {
    return new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
            if (err || response.statusCode > 300) return reject(err || {code: response.statusCode, err: response.body});
            if(response.headers.location){
                if(!body) body = {};
                Object.assign(body, {location:response.headers.location});
            }
            return resolve(body);
        });
    })
}

function _initVoting(req, response, mailbox) {
    return new Promise((resolve) => {
        const allowingVotes = [0, 1, -1];
        if (_.indexOf(allowingVotes, parseInt(req.body.vote)) < 0) return resolve(false);
        HelpScoutVote.get(req.user.username, req.params.id)
            .then(vote => {
                let voted = parseInt(req.body.vote);
                if (!vote) {
                    const Vote = new HelpScoutVote({
                        username: req.user.username,
                        conversationId: req.params.id,
                        vote: voted
                    });
                    return Vote.save()
                        .then(saved => resolve(handleVote(voted)))
                        .catch(err => {
                            console.log('err', err);
                            return resolve(false)
                        })
                }

                if (vote.vote == voted) return resolve(false);

                let resultValue = 0;
                let upvoted = req.body.voteType === 1;
                if (upvoted) {
                    switch (vote.vote) {
                        case 0:
                            resultValue = 1;
                            break;
                        case 1:
                            resultValue = -1;
                            break;
                        case -1:
                            resultValue = 2;
                            break;
                        default:
                            resultValue = 0;
                            break
                    }
                } else if (!upvoted ) {
                    switch (vote.vote) {
                        case 0:
                            resultValue = -1;
                            break;
                        case 1:
                            resultValue = -2;
                            break;
                        case -1:
                            resultValue = 1;
                            break;
                        default:
                            resultValue = 0;
                            break
                    }
                }
                vote.vote = voted;
                vote.save()
                    .then(saved => resolve(handleVote(resultValue)))
                    .catch(err => {
                        return resolve(false)
                    })

            })
            .catch(err => {
                console.log('err', err);
                return resolve(false)
            });
    });


    function handleVote(voted) {
        const voteField = response.item.customFields || [];
        if (voteField.length > 0 && voteField[0].fieldId === mailbox.voteId) {
            voteField[0].value = parseInt(voteField[0].value || 0) + voted;
        }
        else {
            voteField.push({
                fieldId: mailbox.voteId,
                value: voted,
            })
        }
        return voteField;
    }
}

function getQuestionsList(req) {
    return new Promise((resolve, reject) => {
        let param = '';
        switch (req.params.type) {
            case 'issues':
                param = mailboxes['issues'].id;
                break;
            case 'features':
                param = mailboxes['features'].id;
                break;
            case 'questions':
            default:
                param = mailboxes['Q&A'].id;

        }
        const options = _initConversationListParams(param);
        return _submit(options)
            .then(response => mappers.conversation(response))
            .then(response => resolve(mappers.mergeVotes(req.votedConversations, response)))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function validateCustomer(req) {
    return new Promise((resolve, reject) => {
        const customerQuery = _initCustomerSearchParams(req);
        const returnData =  (response) => {
            return resolve(response.items[0]);
        };
        _submit(customerQuery)
            .then(response => {
                if (response.items && response.items[0]) {
                    return returnData(response);
                }
                const customerParams = _initCustomerParams('POST', req);
                return _submit(customerParams)
                    .then(response => {
                        const reqData = {
                            url:response.location,
                            method:'GET',
                        };
                        Object.assign(reqData, defaultParams);
                        return _submit(reqData);
                    })
                    .then(response => {
                        //Wrap fucking helpscout data.
                        response.item.emails[0] = response.item.emails[0].value;
                        response.items = [response.item];
                        delete response.item;
                        return returnData(response);
                    })
                    .catch(err => {
                        console.log('err', err);
                        return reject(Response.onError(err, `Bad request`, 400))
                    })

            })
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))

    })
}

function createQuestion(req) {
    return new Promise((resolve, reject) => {
        let param = '';
        switch (req.params.type) {
            case 'issues':
                param = mailboxes['issues'];
                break;
            case 'features':
                param = mailboxes['features'];
                break;
            case 'questions':
            default:
                param = mailboxes['Q&A'];
                break;
        }
        const conversationParams = _initConversationParams('POST', req, param);
        _submit(conversationParams)
            .then(response => response)
            .delay(5000)
            .then(ret => resolve(`Conversation Created`))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function createQuestionThread(req) {
    return new Promise((resolve, reject) => {
        const threadParams = _initThreadParams('POST', req);
        _submit(threadParams)
            .then(response => resolve(`thread Create`))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function updateQuestionThread(req) {
    return new Promise((resolve, reject) => {
        if (!req.body.threadId) return reject(Response.onError(null, `Provide thread id`, 400));
        if (!req.body.description) return reject(Response.onError(null, `Provide description`, 400));
        const findThread = req.conversation.myThreadId == req.body.threadId;
        if (!findThread) return reject(Response.onError(null, `invalid thread`, 400));
        const threadParams = _initUpdateThread(req);
        _submit(threadParams)
            .then(response => resolve(`thread updated`))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getConversation(req) {
    return new Promise((resolve, reject) => {
        const conversationId = req.params.conversationId || req.params.id;
        if (_.isUndefined(conversationId)) return reject(Response.onError(null, `Provide conversation id`, 400));

        const options = {
            url: `https://api.helpscout.net/v1/conversations/${conversationId}.json`,
            method: 'GET',
        };
        Object.assign(options, defaultParams);
        return _submit(options)
            .then(response => resolve(mappers.mergeVotes(req.votedConversations, mappers.singleConversation(response.item))))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function updateConversation(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.params.id)) return reject(Response.onError(null, `Provide conversation id`, 400));
        let mailbox = '';
        switch (req.params.type) {
            case 'issues':
                mailbox = mailboxes['issues'];
                break;
            case 'features':
                mailbox = mailboxes['features'];
                break;
            case 'questions':
            default:
                mailbox = mailboxes['Q&A'];
                break;

        }
        const getOptions = {
            url: `https://api.helpscout.net/v1/conversations/${req.params.id}.json`,
            method: 'GET',
        };
        Object.assign(getOptions, defaultParams);
        const options = {
            url: `https://api.helpscout.net/v1/conversations/${req.params.id}.json`,
            method: 'PUT',
            body: {}
        };
        Object.assign(options, defaultParams);


        return _submit(getOptions)
            .then(response => {
                Object.assign(options.body, {
                    subject: req.body.subject || response.item.subject,
                    status: req.body.status || response.item.status,
                    tags: req.body.tags ? _.uniq(_.concat(req.body.tags, response.item.tags)) : response.item.tags,
                    reload: true
                });
                return _initVoting(req, response, mailbox);
            })
            .then(voteField => {
                if (voteField)
                    Object.assign(options.body, {customFields: voteField});
                return _submit(options)
            })
            .then(response => resolve(response.item))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getTags(req) {
    return new Promise((resolve, reject) => {
        let param = '';
        switch (req.params.type) {
            case 'issues':
                param = mailboxes['issues'].id;
                break;
            case 'features':
                param = mailboxes['features'].id;
                break;
            default:
                param = mailboxes['Q&A'].id;
        }
        const options = _initConversationListParams(param);
        Object.assign(options, defaultParams);
        return _submit(options)
            .then(response => resolve(_grabTags(response.items)))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function searchConversations(req) {
    return new Promise((resolve, reject) => {
        const options = _initSearchParams(req);
        return _submit(options)
            .then(response => mappers.conversation(response))
            .then(response => resolve(mappers.mergeVotes(req.votedConversations, response)))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getUserVotedConversations(req) {
    return new Promise((resolve) => {
        if (!req.user) return resolve(null);
        HelpScoutVote.list(req.user.username)
            .then(resolve)
            .catch(err => resolve(null));
    })
}

function deleteConversation(req) {
    return new Promise((resolve, reject) => {
        const conversationId = req.params.conversationId || req.params.id;
        if (_.isUndefined(conversationId)) return reject(Response.onError(null, `Provide conversation id`, 400));
        const options = {
            url: `https://api.helpscout.net/v1/conversations/${conversationId}.json`,
            method: 'DELETE',
            auth: {
                'user': apiKey,
                'pass': 'X'
            },
        };
        return _submit(options)
            .then(response => resolve('Conversation deleted'))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}


module.exports = {
    getQuestionsList,
    validateCustomer,
    createQuestion,
    createQuestionThread,
    updateQuestionThread,
    getConversation,
    updateConversation,
    getTags,
    searchConversations,
    getUserVotedConversations,
    deleteConversation
};
