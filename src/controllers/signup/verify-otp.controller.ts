import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";
import { generateApiKey, generateReferralLink } from "../../utils/helpers";
import { createSession } from "../../services/session.service";

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    console.log("➡️ OTP received from request body:", otp);

    if (!otp || otp.length !== 4) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const pendingSignup = req.cookies.pending_signup;
    console.log("➡️ Pending signup cookie:", pendingSignup);

    if (!pendingSignup) {
      return res.status(400).json({ message: "No pending signup found" });
    }

    const {
      authProvider,
      email,
      phone,
      username,
      password,
      role,
      otp: hashedOtp,
    } = pendingSignup;

    if (!authProvider || !username || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "Missing required signup fields",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, hashedOtp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();
    const referralLink = generateReferralLink(username);

    const newUser = await prisma.user.create({
      data: {
        authProvider,
        email: email || null,
        phone: phone || null,
        username,
        password: hashedPassword,
        role,
        referralLink,
        referralPoints: 0,
        apiKey,
      },
    });

    console.log("✅ User created successfully:", newUser);

    res.clearCookie("pending_signup", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("signup_contact", { path: "/" });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    await createSession(req, { userId: newUser.id, token });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
