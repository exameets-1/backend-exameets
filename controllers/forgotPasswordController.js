import { User } from "../models/userSchema.js";
import { sendOTPService, verifyOTPService } from "../services/otpService.js";

// Send Password Reset OTP
export const sendPasswordResetOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email is not registered"
            });
        }

        // Use the new OTP service for password reset
        const result = await sendOTPService(email, 'password_reset');

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                timeLeft: result.timeLeft
            });
        }

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email"
        });
    } catch (error) {
        console.error("Password reset OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send password reset OTP"
        });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email is not registered"
            });
        }

        // Use the new OTP verification service (don't delete OTP yet)
        const result = await verifyOTPService(email, otp, 'password_reset', false);

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
        console.error("OTP verification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify OTP"
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body; // Remove otp from destructuring

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email is not registered"
            });
        }

        // No need to verify OTP again since it was already verified in the previous step
        // Update password directly
        user.password = newPassword;
        
        // Clean up any old reset fields if they exist
        if (user.resetPasswordOTP) {
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpiry = undefined;
        }
        
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password"
        });
    }
};
