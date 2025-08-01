import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // This automatically creates an index
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 6
    },
    type: {
        type: String,
        enum: ['email_verification', 'password_reset'],
        default: 'email_verification'
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Limit verification attempts
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // This automatically creates a TTL index
    }
});

// Remove duplicate index definitions - they're already created by unique and expires above
// otpSchema.index({ email: 1 }); // Removed - already indexed by unique: true
// otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }); // Removed - already indexed by expires: 300

export const Otp = mongoose.model('Otp', otpSchema);