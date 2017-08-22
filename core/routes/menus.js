/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const pagesRequester = require('../requesters/pages');


const router = express.Router();

router.route('/')
    .get(pagesRequester.menuList);


module.exports = router;