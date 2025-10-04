import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken"

export const isAuthenticated = catchAsyncErrors(async(req, res, next) => {
    const {token} = req.cookies;    
    if(!token){
        return next(new ErrorHandler("User not authenticated", 400));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        
        // Admin panel - only allow admin users
        if (user.role !== 'admin') {
            return next(new ErrorHandler("Access denied. Admin privileges required", 403));
        }
        
        req.user = user;
        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
});