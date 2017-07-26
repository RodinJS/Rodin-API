/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const gitRequester = require('../requesters/git');

const router = express.Router();


router.route('/')
    .get(gitRequester.initSync);

router.route('/sync')
    .get(gitRequester.sync);

router.route('/theirs')
    .post(gitRequester.theirs)


module.exports = router;