import express from 'express';
import {
    addToWhatsNew,
    getWhatsNew
} from '../controllers/whatsNewController.js';

const router = express.Router();

router.route('/add').post(addToWhatsNew);
router.route('/getall').get(getWhatsNew);

export default router;
