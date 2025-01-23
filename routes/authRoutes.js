import express from 'express';
import { verifyEmailOTP, verifyPhoneOTP } from '../controllers/authController.js';

const router = express.Router();

router.post('/verify-email-otp', verifyEmailOTP);
router.post('/verify-phone-otp', verifyPhoneOTP);

export default router;