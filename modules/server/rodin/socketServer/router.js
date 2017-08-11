/**
 * Created by xgharibyan on 1/13/17.
 */

import express from 'express';
import handler from './handler';
import apiSockets from './apiSocket';
const router = express.Router();	// eslint-disable-line new-cap


router.route('/')
    .get(handler.validate, handler.serverFile);

router.route('/subscribe')
    .post(apiSockets.subscribe);

export default router;


