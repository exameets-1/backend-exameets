// utils/sendSms.js
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendSMS = async ({ to, message }) => {
    try {
        const response = await client.messages.create({
            body: message,
            from: twilioPhone,
            to: to
        });

        return {
            success: true,
            sid: response.sid,
            status: response.status
        };
    } catch (error) {
        console.error('Twilio SMS Error:', error);
        throw new Error('Failed to send SMS');
    }
};