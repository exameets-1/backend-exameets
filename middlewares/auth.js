import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken"

export const isAuthenticated = catchAsyncErrors(async(req, res, next) => {
    const {token} = req.cookies;
    
    // Don't check authentication for login and register routes
    const publicRoutes = [
        '/login',
        '/register',
        '/roadmap/all',
        '/course/all',
        '/quiz/all'
    ];
    
    // Skip authentication for public routes
    if (publicRoutes.includes(req.path)) {
        return next();
    }
    
    if(!token){
        return next(new ErrorHandler("User not authenticated", 400));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const user = await User.findById(decoded._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        
        req.user = user;
        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
});