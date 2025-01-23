import express from "express";
import { sendPasswordResetOTP, verifyOTP, resetPassword } from "../controllers/forgotPasswordController.js";

const router = express.Router();

router.post("/send-otp", sendPasswordResetOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
