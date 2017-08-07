/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const editorRequester = require('../requesters/editor');
const multer = require('multer');
const router = express.Router();
const upload = multer();

router.route('/serve')
    .get(editorRequester.getFile)
    .put(editorRequester.putFile)
    .post(editorRequester.postFile)
    .delete(editorRequester.deleteFile)



module.exports = router;