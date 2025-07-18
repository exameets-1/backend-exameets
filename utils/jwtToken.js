// export const sendToken = (user, statusCode, res, message) => {
//   const token = user.getJWTToken();
//   const options = {
//      expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
//      httpOnly: true,
//      secure: process.env.NODE_ENV === 'production',
//      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
//      path: '/'
//    };
  
//   res.status(statusCode)
//      .cookie("token", token, options)
//      .json({
//           success: true,
//           user,
//           message,
//      });
// };

// export const sendToken = (user, statusCode, res, message) => {
//   const token = user.getJWTToken();
//   const options = {
//     expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//     path: '/',
//   };

//   res
//     .status(statusCode)
//     .cookie("token", token, options)
//     .json({
//       success: true,
//       user,
//       message,
//     });
// };

export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.exameets.in' : undefined,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user,
      message,
    });
};

