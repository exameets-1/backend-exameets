import express from "express";
import { sendEmailOTP, verifyEmailOTP } from "../controllers/emailVerificationController.js";

const router = express.Router();

router.post('/send-otp', sendEmailOTP);
router.post('/verify-otp', verifyEmailOTP);

export default router;
