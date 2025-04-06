// routes/phoneVerificationRoutes.js
import express from "express";
import { sendPhoneOTP, verifyPhoneOTP } from "../controllers/phoneVerificationController.js";

const router = express.Router();

router.post('/send-otp', sendPhoneOTP);
router.post('/verify-otp', verifyPhoneOTP);

export default router;