import { Request, Response } from "express";
import bcrypt from "bcryptjs";

export const verifyForgotPasswordOTP = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    console.log("➡️ OTP received for forgot password:", otp);

    if (!otp || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    const pendingReset = req.cookies.pending_reset;
    console.log("➡️ Pending reset cookie:", pendingReset);

    if (!pendingReset) {
      return res
        .status(400)
        .json({ message: "No pending password reset found or expired" });
    }

    const { authProvider, email, phone, userId, otp: hashedOtp } = pendingReset;

    const isOtpValid = await bcrypt.compare(otp, hashedOtp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.cookie(
      "pending_reset",
      {
        authProvider,
        email: email || null,
        phone: phone || null,
        userId,
        isOtpVerified: true,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("Forgot password OTP verification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
