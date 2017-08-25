/**
 * Created by xgharibyan on 6/27/17.
 */
const _ = require('lodash');
const Promise = require('bluebird');
const Q = require('q');
const helpscout = require('helpscout');
const request = require('request');
const HelpScoutDocs = require('helpscout-docs');
const APIError = require('../../common/APIError');
const httpStatus = require('../../common/httpStatus');
const Response = require('../../common/servicesResponses');
const Landing = require('../../models/landing');
const Menus = require('../../models/menus');
const Pages = require('../../models/pages');

const helscoutKey = '30cb62d47f4d29a73e6f1e268a90a5c7102178fd';

const HpScout = require('helpscout')(helscoutKey);
const HelpDesk = Promise.promisifyAll(helpscout(helscoutKey));

const hsdocs = _.reduce(new HelpScoutDocs(helscoutKey), (result, value, key) => {
    result[key] = _.reduce(value, (r, v, k) => {
        r[k] = Promise.promisify(v);
        return r;
    }, {});
    return result;
}, {});
let HelpDeskDocsCollections = [];
initHelpDeskCollections();

function initHelpDeskCollections() {
    hsdocs.collections.getAll()
        .then((response) => {
            return HelpDeskDocsCollections = response.collections.items;
        })
        .catch((err) => {
            console.log('collectionsError', err);
        });
}

function pagesList(req){
    return new Promise((resolve, reject)=>{
        Pages.getPagesList()
            .then((pagesList) => resolve(pagesList))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getByUrl(req){
    return new Promise((resolve, reject)=>{
        if (_.isUndefined(req.params.url)) {
            return reject(Response.onError(null, `Provide URL`, 400))
        }

        if (req.params.url === 'landing') {
            return Landing.get()
                .then(page => resolve(page))
                .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
        }

        const pageURL = req.params.url;
        Pages.get(pageURL)
            .then(page => resolve(page))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getFaq(req){
    return new Promise((resolve, reject)=>{
        const colletionID = _.find(HelpDeskDocsCollections, (collection) => collection.slug === 'faq').id;
        hsdocs.articles.getAllByCollection({id: colletionID})
            .then((articles) => {
                const articlesQueue = _.map(articles.articles.items, (val, key) => hsdocs.articles.get({id: val.id}));
                return Q.all(articlesQueue);
            })
            .then((articlesList) => {
                const mappedArticles = _.map(articlesList, (article) => _.pick(article.article, ['id', 'name', 'text', 'createdAt']));
                return resolve(mappedArticles)
            })
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getKnowledgeCategories(req){
    return new Promise((resolve, reject)=>{
        const colletionID = _.find(HelpDeskDocsCollections, (collection) => collection.slug === 'knowlagebase').id;
        const allowFields = ['articleCount', 'name', 'id', 'slug', 'visibility'];
        hsdocs.categories.getAllByCollection({id: colletionID})
            .then((response) => resolve(_.map(response.categories.items, (category) => _.pick(category, allowFields))))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getKnowlegeCategoryArticles(req){
    return new Promise((resolve, reject)=>{
        if (_.isUndefined(req.params.categoryId)) {
            return reject(Response.onError(null, `Provide category id`, 400))
        }

        const allowFields = ['slug', 'status', 'name', 'popularity', 'viewCount', 'createdAt', 'updatedAt', 'id'];

        hsdocs.articles.getAllByCategory({id: req.params.categoryId})
            .then((response) => resolve(_.map(response.articles.items, (article) => _.pick(article, allowFields))))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getKnowlegeArticle(req){
    return new Promise((resolve, reject)=>{
        if (_.isUndefined(req.params.articleId)) {
            return reject(Response.onError(null, `Provide category id`, 400))
        }

        const allowedFields = ['id', 'slug', 'status', 'name', 'text', 'popularity', 'viewCount'];

        hsdocs.articles.get({id: req.params.articleId})
            .then((response) => resolve(_.pick(response.article, allowedFields)))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}

function getMenuList(req){
    return new Promise((resolve, reject)=>{
        Menus.getMenusList()
            .then((menusList) => resolve(menusList))
            .catch(err=>reject(Response.onError(err, `Bad request`, 400)))
    })
}



module.exports = {
    pagesList,
    getByUrl,
    getFaq,
    getKnowledgeCategories,
    getKnowlegeCategoryArticles,
    getKnowlegeArticle,
    getMenuList
};
