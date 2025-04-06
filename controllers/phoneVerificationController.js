// controllers/phoneVerificationController.js
import { sendSMS } from "../utils/sendSMS.js";
import crypto from "crypto";

// Store OTPs with expiry (in memory)
const otpStore = new Map();

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const sendPhoneOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        
        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with 5 minutes expiry
        otpStore.set(phone.replace('+91', ''), {
            otp,
            expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
        
        // Validate phone format
        // Send OTP via SMS
        const message = `Your OTP for phone verification is: ${otp}. This OTP will expire in 5 minutes.`;
        
        await sendSMS({
            to: `+91${phone}`, // Add country code
            message
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("SMS OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP via SMS"
        });
    }
};

export const verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required"
            });
        }

        const storedData = otpStore.get(phone);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired or not sent. Please request a new OTP"
            });
        }

        if (Date.now() > storedData.expiry) {
            otpStore.delete(phone);
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
        otpStore.delete(phone);

        res.status(200).json({
            success: true,
            message: "Phone number verified successfully"
        });

    } catch (error) {
        console.error("Phone Verification Error:", error);
        return res.status(400).json({
            success: false,
            message: "Invalid OTP", // Consistent key
            errorCode: "INVALID_OTP" // Add error codes
        });
    }
};