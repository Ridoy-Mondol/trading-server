import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../../utils/sendOtpEmail";
import { sendOtpSMS } from "../../utils/sendOtpSMS";

const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { contact } = req.body;
    console.log("➡️ Received contact from request body:", contact);

    if (!contact) {
      return res.status(400).json({ message: "Contact is required" });
    }

    const pendingSignup = req.cookies.pending_signup;
    console.log("➡️ Pending signup cookie:", pendingSignup);

    if (!pendingSignup) {
      return res.status(400).json({ message: "No pending signup found" });
    }

    const cleanPhone = (num: string | null | undefined) => {
      return num ? num.replace(/[^\d]/g, "") : num;
    };

    const { authProvider, email, phone, username, password } = pendingSignup;
    
    const cleanedCookiePhone = cleanPhone(phone);
    const cleanedContact = cleanPhone(contact);

    console.log("➡️ Pending signup data:", {
      authProvider,
      email,
      cleanedCookiePhone,
      username,
      password,
    });

    if (
      (authProvider === "EMAIL" && email !== contact) ||
      (authProvider === "PHONE" && cleanedCookiePhone !== cleanedContact)
    ) {
      return res
        .status(400)
        .json({ message: "Contact does not match pending signup" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (authProvider === "EMAIL") {
      console.log(`📧 Sending OTP to email: ${email}`);
      await sendOtpEmail(email!, otp, "signup");
    } else if (authProvider === "PHONE") {
      console.log(`📱 Sending OTP via SMS to phone: ${cleanedCookiePhone}`);
      await sendOtpSMS(cleanedCookiePhone!, otp, "signup");
    }

    res.cookie(
      "pending_signup",
      {
        authProvider,
        email: email || null,
        phone: cleanedCookiePhone || null,
        username,
        password,
        otp: hashedOtp,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      }
    );
    console.log("✅ Pending signup cookie updated with hashed OTP");

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully via ${
        authProvider === "EMAIL" ? "email" : "phone"
      }`,
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
