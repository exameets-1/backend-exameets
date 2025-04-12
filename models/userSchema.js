import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true,
        minLength: [3, "Name must be at least 3 characters long"],
        maxLength: [30, "Name cannot exceed 30 characters"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: [validator.isEmail, "Please enter a valid email"]
    },
    phone: {
        type: String,
        required: [true, "Please enter your phone number"],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: "Please enter a valid 10-digit phone number"
        }
    },
    dob: {
        type: Date,
        required: [true, "Please enter your date of birth"]
    },
    gender: {
        type: String,
        required: [true, "Please select your gender"],
        enum: {
            values: ["male", "female", "other"],
            message: "Please select a valid gender"
        },
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [8, "Password must be at least 8 characters long"],
        select: false
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    preferences: {
        notifications_about: {
            type: String,
        },
        isStudying: {
            type: Boolean,
        },
        educationLevel: {
            type: String,
            enum: ["high-school", "undergraduate", "postgraduate", "other"],
        },
        preferencesSet: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!enteredPassword) {
        throw new Error("Password is required");
    }
    
    if (!this.password) {
        throw new Error("User password not found");
    }

    try {
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        return isMatch;
    } catch (error) {
        throw new Error("Failed to verify password");
    }
};

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

export const User = mongoose.model("User", userSchema);
