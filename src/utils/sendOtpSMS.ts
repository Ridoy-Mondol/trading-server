// Example using a placeholder function — replace with Twilio or other SMS service
export const sendOtpSMS = async (phone: string, otp: string) => {
  try {
    // Example: integrate your SMS provider here
    // Twilio example:
    // await client.messages.create({
    //   body: `Your verification code is: ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });

    console.log(`✅ OTP SMS sent to ${phone}: ${otp}`);
  } catch (err) {
    console.error("Failed to send OTP SMS:", err);
    throw err;
  }
};
