import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../config/prisma-client";
import { sendOtpEmail } from "../../../utils/sendOtpEmail";
import { sendOtpSMS } from "../../../utils/sendOtpSMS";

const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const forgotPasswordOTP = async (req: Request, res: Response) => {
  try {
    const { authProvider, email, phone } = req.body;
    console.log("➡️ Forgot password request:", { authProvider, email, phone });

    if (
      !authProvider ||
      (authProvider === "EMAIL" && !email) ||
      (authProvider === "PHONE" && !phone)
    ) {
      return res
        .status(400)
        .json({ message: "Valid email or phone is required" });
    }

    const cleanPhone = (num: string | null | undefined) => {
      return num ? num.replace(/[^\d]/g, "") : num;
    };

    const cleanedPhone = cleanPhone(phone);

    let user = null;
    if (authProvider === "EMAIL") {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (authProvider === "PHONE") {
      if (!cleanedPhone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      user = await prisma.user.findUnique({ where: { phone: cleanedPhone } });
    }

    if (!user) {
      console.log("⚠️ Forgot password request for non-existing account");

      const channel =
        authProvider === "EMAIL" ? "email address" : "phone number";

      return res.status(404).json({
        success: false,
        message: `We could not process your request. Please make sure you entered the correct ${channel}.`,
      });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (authProvider === "EMAIL" && user.email) {
      console.log(`📧 Sending OTP to email: ${user.email}`);
      await sendOtpEmail(user.email, otp, "forgot_password");
    } else if (authProvider === "PHONE" && user.phone) {
      const cleanedPhone = cleanPhone(user.phone);
      console.log(`📱 Sending OTP via SMS to phone: ${cleanedPhone}`);
      await sendOtpSMS(cleanedPhone!, otp, "forgot_password");
    }

    res.cookie(
      "pending_reset",
      {
        authProvider,
        email: user.email || null,
        phone: cleanedPhone || null,
        userId: user.id,
        otp: hashedOtp,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      }
    );
    console.log("✅ Pending reset cookie set with hashed OTP");

    return res.status(201).json({
      success: true,
      message: `An OTP has been sent via ${
        authProvider === "EMAIL" ? "email" : "phone"
      }.`,
    });
  } catch (err) {
    console.error("Forgot password OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
