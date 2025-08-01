import { Otp } from '../models/otpSchema.js'
import { sendEmail } from '../utils/sendEmail.js'

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPService = async (email, type = 'email_verification') => {
    try {
        // Check if OTP already exists for this email
        const existingOtp = await Otp.findOne({ email: email.toLowerCase() });
        
        if (existingOtp) {
            // Calculate remaining time
            const timeLeft = Math.ceil((existingOtp.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000);
            
            if (timeLeft > 0) {
                return {
                    success: false,
                    message: `OTP already sent. Please wait ${Math.ceil(timeLeft / 60)} minutes before requesting again.`,
                    timeLeft: timeLeft
                };
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        
        // Store/Update OTP in database (upsert)
        await Otp.findOneAndUpdate(
            { email: email.toLowerCase() },
            { 
                otp: otp,
                type: type,
                attempts: 0,
                createdAt: new Date()
            },
            { 
                upsert: true, 
                new: true 
            }
        );

        // Send email
        const emailSubject = type === 'email_verification' ? 'Email Verification OTP' : 'Password Reset OTP';
        const emailMessage = `Your OTP for ${type === 'email_verification' ? 'email verification' : 'password reset'} is: ${otp}. This OTP will expire in 5 minutes.`;
        
        await sendEmail({
            email: email,
            subject: emailSubject,
            message: emailMessage,
            type: 'signin'
        });

        return {
            success: true,
            message: 'OTP sent successfully'
        };

    } catch (error) {
        console.error('Error in sendOTPService:', error);
        throw error;
    }
};

export const verifyOTPService = async (email, providedOtp, type = 'email_verification', deleteAfterVerify = true) => {
    try {
        // Validate input parameters
        if (!email || !providedOtp) {
            return {
                success: false,
                message: "Email and OTP are required."
            };
        }

        // Find OTP document
        const otpDoc = await Otp.findOne({ 
            email: email.toLowerCase(),
            type: type 
        });

        if (!otpDoc) {
            return {
                success: false,
                message: "OTP has expired or not sent. Please request a new OTP."
            };
        }

        // Check if too many attempts
        if (otpDoc.attempts >= 3) {
            // Delete the OTP document to prevent further attempts
            await Otp.deleteOne({ _id: otpDoc._id });
            return {
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            };
        }

        // Verify OTP
        if (otpDoc.otp !== providedOtp.toString()) {
            // Increment attempts
            await Otp.findByIdAndUpdate(otpDoc._id, { 
                $inc: { attempts: 1 } 
            });
            
            return {
                success: false,
                message: `Invalid OTP. ${2 - otpDoc.attempts} attempts remaining.`
            };
        }

        // OTP is correct - delete the document only if specified
        if (deleteAfterVerify) {
            await Otp.deleteOne({ _id: otpDoc._id });
        }
        
        return {
            success: true,
            message: "OTP verified successfully"
        };

    } catch (error) {
        console.error('Error in verifyOTPService:', error);
        throw error;
    }
};

export const cleanupExpiredOTPs = async () => {
    try {
        // This is handled automatically by MongoDB TTL, but we can add manual cleanup if needed
        const result = await Otp.deleteMany({
            createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
        });
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
        return 0;
    }
};
