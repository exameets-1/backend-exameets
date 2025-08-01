import { sendOTPService, verifyOTPService } from "../services/otpService.js";

export const sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Use the new OTP service
        const result = await sendOTPService(email, 'email_verification');

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                timeLeft: result.timeLeft
            });
        }

        res.status(200).json({
            success: true,
            message: result.message
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

        // Use the new OTP verification service
        const result = await verifyOTPService(email, otp, 'email_verification');

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("Email Verification Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            errorCode: "VERIFICATION_ERROR"
        });
    }
};
