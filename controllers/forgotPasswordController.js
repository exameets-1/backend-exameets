import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";


// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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

        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP and its expiry in user document
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpiry = Date.now() + 5 * 60 * 1000; // 10 minutes
        await user.save();

        // Send email
        const message = `Your OTP for password reset is: ${otp}. This OTP will expire in 5 minutes.`;
        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP",
            message,
            type: 'login'
        });

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        user.password = newPassword;
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpiry = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
