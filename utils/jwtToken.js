export const sendToken = (user, statusCode, res, message) => {
    const token = user.getJWTToken();
    
    // Cookie options properly configured for production and development
    const options = {
        expires: new Date(
            Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only true in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site in production
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined // Critical for subdomain sharing
    };
    
    res.status(statusCode)
       .cookie("token", token, options)
       .json({
            success: true,
            user,
            message
       });
};