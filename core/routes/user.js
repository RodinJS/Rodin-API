/**
 * Created by xgharibyan on 6/28/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const userRequester = require('../requesters/user');

const router = express.Router();

router.route('/')
    .post(validate(paramValidation.createUser), userRequester.create);

router.route('/me')
    .get(userRequester.me);

router.route('/confirmUsername')
    .post(userRequester.confirmUsername);

router.route('/password')
    .put(validate(paramValidation.updatePassword), userRequester.updatePassword);

router.route('/resetPassword')
    .get(userRequester.checkResetPasswordUsed)
    .post(userRequester.resetPassword)
    .put(validate(paramValidation.updatePassword), userRequester.changePassword);

router.route('/unsync/:username/:socialName')
    .get(userRequester.unSyncSocial);

router.route('/metaverse')
    .post(userRequester.metaverse);

router.route('/:username')
    .put(validate(paramValidation.updateUser), userRequester.updateUser)
    .delete(userRequester.deleteUser);



module.exports = router;