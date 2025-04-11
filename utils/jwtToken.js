export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.admin.exameets.in' : undefined
  };
  
  // Log for debugging, remove in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('cookie options:', options);
  }
  
  // Filter user data to avoid sending sensitive information
  const safeUserData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    dob: user.dob,
    gender: user.gender,
    role: user.role,
    createdAt: user.createdAt
    // Include additional fields from the form data as needed
  };
  
  return res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user: safeUserData,
      message
    });
};