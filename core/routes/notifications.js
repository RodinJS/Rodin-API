/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const notificationsRequester = require('../requesters/hooks');

const router = express.Router();

router.route('/')
    .get(notificationsRequester.get)
    .put(notificationsRequester.update)
    .delete(notificationsRequester.remove)



module.exports = router;