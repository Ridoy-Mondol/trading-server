import { Request, Response } from "express";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../../config/prisma-client";
import { createNotification } from "../../services/notification.service";

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { code, password } = req.body;
    console.log("Received request body", req.body);

    if (!code || !password) {
      console.log("Missing code or password");
      return res
        .status(400)
        .json({ message: "2FA code and password are required" });
    }

    const tokenCookie = req.cookies.auth_token;
    if (!tokenCookie) {
      console.log("No auth token provided");
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET not defined");
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET) as {
      id: string;
      username: string;
    };
    if (!decoded?.id) {
      console.log("Invalid JWT payload");
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = Number(decoded.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      console.log("User password not set");
      return res.status(400).json({ message: "Password not set" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid?", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user?.twoFASecret) {
      console.log("2FA not initiated");
      return res.status(400).json({ message: "2FA not initiated" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    console.log("2FA TOTP verified?", verified);

    if (!verified) {
      console.log("Invalid 2FA code");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { is2FAEnabled: true },
    });
    console.log("2FA enabled successfully");

    await createNotification(
      userId,
      "SECURITY",
      "Two-Factor Authentication Enabled",
      "You have successfully enabled two-factor authentication on your account. This adds an extra layer of security to help keep your funds and data safe."
    );

    return res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA verification error:", error);
    return res.status(500).json({ message: "Error verifying 2FA" });
  }
};
