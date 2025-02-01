import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { sendToken } from "../utils/jwtToken.js";
import { GovtJob } from "../models/govtJobSchema.js";
import { Job } from "../models/jobSchema.js";

// Removing all bookmark, roadmap and quiz related functions and keeping only the essential user functions
export const register = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, password, phone, dob, gender } = req.body;

        if (!name || !email || !password || !phone || !dob || !gender) {
            return next(new ErrorHandler("Please enter all required fields", 400));
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"  
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            dob,
            gender
        });

        sendToken(user, 201, res, "Registered Successfully");
    } catch (error) {
        next(error);
    }
});

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    // Get user with password and ensure it's a full document
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res, "Logged in successfully");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    }).json({
      success: true,
      message: "Logged out successfully",
    });
  });
  

export const getMyProfile = catchAsyncErrors(async (req, res, next) => {
    
    if (!req.user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Fetch fresh user data from database
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler("User not found in database", 404));
    }
    
    res.status(200).json({
        success: true,
        user
    });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const { name, dob, gender } = req.body;
    const newUserData = {};

    // Only update fields that are provided
    if (name !== undefined) {
        if (name.length < 3 || name.length > 30) {
            return next(new ErrorHandler("Name must be between 3 and 30 characters", 400));
        }
        newUserData.name = name.trim();
    }

    if (dob !== undefined) {
        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
            return next(new ErrorHandler("Invalid date of birth", 400));
        }
        newUserData.dob = dobDate;
    }

    if (gender !== undefined) {
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(gender.toLowerCase())) {
            return next(new ErrorHandler("Invalid gender value", 400));
        }
        newUserData.gender = gender.toLowerCase();
    }

    // Only proceed if there are fields to update
    if (Object.keys(newUserData).length === 0) {
        return next(new ErrorHandler("No valid fields provided for update", 400));
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        newUserData,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user
    });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please provide both old and new passwords", 400));
    }

    const user = await User.findById(req.user.id).select("+password");
    
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const isPasswordMatched = await user.comparePassword(oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Current password is incorrect", 400));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password Updated Successfully"
    });
});

export const deleteAccount = catchAsyncErrors(async (req, res, next) => {
    const { password } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  await User.findByIdAndDelete(req.user.id);


    res
        .status(200)
        .cookie("token", "", {
            expires: new Date(Date.now()),
            httpOnly: true,
        })
        .json({
            success: true,
            message: "Account Deleted Successfully",
        });
});

export const checkEmailExists = catchAsyncErrors(async (req, res) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    
    res.status(200).json({
        success: true,
        exists: !!existingUser
    });
});

export const checkPhoneExists = catchAsyncErrors(async (req, res) => {
    const { phone } = req.body;
    const existingUser = await User.findOne({ phone });
    
    res.status(200).json({
        success: true,
        exists: !!existingUser
    });
});

export const getMatchedJobs = catchAsyncErrors(async (req, res, next) => {
    // Check if user exists and has preferences set
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (!user.preferences || !user.preferences.notifications_about) {
        return next(new ErrorHandler("Notification preferences not set", 400));
    }

    const notificationPreference = user.preferences.notifications_about;

    if(notificationPreference === "IT"){
        const jobs = await Job.find({ category: "IT" });
        res.status(200).json({
            success: true,
            jobs
        })
    } else if(notificationPreference === "NON-IT"){
        const jobs = await Job.find({ category: { $ne: "IT" } });
        res.status(200).json({
            success: true,
            jobs
        })
    } else if(notificationPreference !== "admissions" && notificationPreference !== "scholarships" && notificationPreference !== "internships" && notificationPreference !== "results") {
        const jobs = await GovtJob.find({
            notification_about : notificationPreference.toUpperCase()
        });
        res.status(200).json({
            success: true,
            jobs,
        })
    }
});