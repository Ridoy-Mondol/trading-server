import { Request, Response } from "express";
import prisma from "../../config/prisma-client";
import { Provider } from "@prisma/client";

export const signup = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, phone, username, password, authProvider } = req.body;

    console.log(
      "➡️ Signup request received:",
      req.body,
      email,
      phone,
      username,
      password,
      authProvider
    );

    if (![Provider.EMAIL, Provider.PHONE].includes(authProvider)) {
      return res.status(400).json({ message: "Invalid auth provider" });
    }

    if (authProvider === Provider.EMAIL && !email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (authProvider === Provider.PHONE && !phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const isStrongPassword = (pass: string) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass);

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
          { username },
        ].filter(Boolean) as Record<string, any>[],
      },
    });

    if (existing) {
      console.log("⚠️ Existing user found:", existing);
      if (
        (email && existing.email === email) ||
        (phone && existing.phone === phone)
      ) {
        return res.status(409).json({ message: "User already exists" });
      }
      if (existing.username === username) {
        return res
          .status(409)
          .json({ message: "This username is already taken" });
      }
    }

    res.cookie(
      "pending_signup",
      {
        authProvider,
        email: email || null,
        phone: phone || null,
        username,
        password,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      }
    );

    console.log("✅ Signup data validated. Ready to send OTP.");
    return res.status(200).json({
      success: true,
      message: "Signup data validated. Ready to send OTP.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
