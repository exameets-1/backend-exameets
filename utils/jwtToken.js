
export const sendToken = (user,statusCode, res, message) => {
    const token = user.getJWTToken();
    
    // Cookie options with more permissive settings for development
    const options = {
        expires: new Date(
            Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000 // Default to 7 days if not set
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',

    };
    console.log('cookie options :', options);
    
    res.status(statusCode)
       .cookie("token", token, options)
       .json({
            success: true,
            user,
            message
       });
};