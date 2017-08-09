/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const pagesRequester = require('../requesters/pages');

const router = express.Router();


router.route('/')
    .get(pagesRequester.pagesList);

router.route('/:url')
    .get(pagesRequester.getByUrl);

router.route('/support/faq')
    .get(pagesRequester.getFaq);

router.route('/support/knowledgebase/categories')
    .get(pagesRequester.getKnowledgeCategories);

router.route('/support/knowledgebase/articles/:categoryId')
    .get(pagesRequester.getKnowlegeCategoryArticles);

router.route('/support/knowledgebase/article/:articleId')
    .get(pagesRequester.getKnowlegeArticle);

module.exports = router;