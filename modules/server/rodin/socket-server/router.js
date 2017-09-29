/**
 * Created by xgharibyan on 1/13/17.
 */

const express = require('express');
const handler = require('./handler');
const apiSockets =  require('./apiSocket');
const router = express.Router();


router.route('/')
    .get(handler.validate, handler.serverFile);

router.route('/subscribe')
    .post(apiSockets.subscribe);

module.exports = router;


