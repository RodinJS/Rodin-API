/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const supportRequester = require('../requesters/support');

const router = express.Router();


router.route('/:type')
    .get(supportRequester.getQuestionsList)
    .post(supportRequester.createQuestion);


router.route('/thread/:conversationId')
    .post(supportRequester.createQuestionThread)
    .put(supportRequester.updateQuestionThread);

router.route('/conversation/:type/:id')
    .get(supportRequester.getConversation)
    .put(supportRequester.updateConversation)
    .delete(supportRequester.deleteConversation);

router.route('/tags/:type')
    .get(supportRequester.getTags);

router.route('/search/:type')
    .get(supportRequester.searchConversations);

module.exports = router;