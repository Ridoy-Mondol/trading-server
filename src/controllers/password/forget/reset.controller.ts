import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../config/prisma-client";
import { createSession } from "../../../services/session.service";
import { createNotification } from "../../../services/notification.service";

export const resetForgotPassword = async (req: Request, res: Response) => {
  try {
    const { contact, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ message: "New password is required" });
    }

    if (!contact || typeof contact !== "string") {
      return res.status(400).json({ message: "Contact is required" });
    }

    const isStrongPassword = (pass: string) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass);

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    const pendingReset = req.cookies.pending_reset;

    if (!pendingReset || !pendingReset.userId) {
      return res
        .status(400)
        .json({ message: "No pending password reset found or expired" });
    }

    const isOtpVerified =
      typeof pendingReset.isOtpVerified === "string"
        ? pendingReset.isOtpVerified === "true"
        : Boolean(pendingReset.isOtpVerified);

    if (!isOtpVerified) {
      return res.status(400).json({
        message: "OTP verification required before resetting password",
      });
    }

    const { userId, email, phone } = pendingReset;

    const cleanPhone = (num: string | null | undefined) =>
      num ? num.replace(/[^\d]/g, "") : num;

    let contactMatches = false;

    if (email) {
      contactMatches = contact === email;
    } else if (phone) {
      const cleanedPhone = cleanPhone(phone);
      const cleanedContact = cleanPhone(contact);
      contactMatches = cleanedContact === cleanedPhone;
    }

    if (!contactMatches) {
      return res
        .status(400)
        .json({ message: "Provided contact does not match pending reset" });
    }

    const id = Number(userId);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.clearCookie("pending_reset", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    const token = jwt.sign(
      { id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    await createSession(req, { userId: user.id, token });

    await createNotification(
      userId,
      "SECURITY",
      "Password changed",
      "You have successfully reset your account password."
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
