import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error(
    "Twilio credentials or phone number are missing in environment variables"
  );
}

console.log("✅ Twilio environment variables loaded successfully");

console.log("📡 Initializing Twilio client...");
const client = Twilio(accountSid, authToken);
console.log("✅ Twilio client initialized");

export const sendOtpSMS = async (phone: string, otp: string) => {
  console.log("🚀 sendOtpSMS called");
  console.log("📞 Phone:", phone);
  console.log("🔢 OTP:", otp);
  try {
    if (!phone) {
      throw new Error("Phone number not provided");
    }

    console.log("✉️ Sending OTP SMS...");
    await client.messages.create({
      body: `Your XPRTrade verification code is: ${otp}`,
      from: twilioPhoneNumber,
      to: phone,
    });
    console.log(`✅ OTP SMS sent to ${phone}: ${otp}`);
  } catch (err) {
    console.error("Failed to send OTP SMS:", err);
    throw err;
  }
};
