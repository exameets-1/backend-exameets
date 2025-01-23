import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

// Store OTPs with expiry (in memory - consider using Redis in production)
const otpStore = new Map();

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with 5 minutes expiry
        otpStore.set(email, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        // Send OTP via email
        const message = `Your OTP for email verification is: ${otp}\n\nThis OTP will expire in 5 minutes.`;
        
        await sendEmail({
            email,
            subject: "Email Verification OTP",
            message
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("Email OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

export const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const storedData = otpStore.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired or not sent. Please request a new OTP"
            });
        }

        if (Date.now() > storedData.expiry) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP"
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Clear OTP after successful verification
        otpStore.delete(email);

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
