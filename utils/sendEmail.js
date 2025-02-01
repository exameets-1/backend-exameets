import nodeMailer from "nodemailer"

export const sendEmail = async({email, subject, message, type = 'signin'})=>{
    const transporter = nodeMailer.createTransport({
        host : process.env.SMTP_HOST,
        service: process.env.SMTP_SERVICE,
        port : process.env.SMTP_PORT,
        auth : {
            user : type === 'signin' ? process.env.SMTP_MAIL_SIGNIN : process.env.SMTP_MAIL_LOGIN,
            pass : type === 'signin' ? process.env.SMTP_PASSWORD_SIGNIN : process.env.SMTP_PASSWORD_LOGIN
        }
    })

    const options = {
        from : type === 'signin' ? process.env.SMTP_MAIL_SIGNIN : process.env.SMTP_MAIL_LOGIN,
        to : email,
        subject,
        text : message
    }
    await transporter.sendMail(options);
}