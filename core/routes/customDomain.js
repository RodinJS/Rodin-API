const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const customDomainRequester = require('../requesters/customDomain');

const router = express.Router();

router.route('/')
    .post(customDomainRequester.add)
    .delete(customDomainRequester.remove)

module.exports = router;