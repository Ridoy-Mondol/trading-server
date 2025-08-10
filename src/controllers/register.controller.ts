import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma-client";
import { generateApiKey, generateReferralLink } from "../utils/helpers";
import { Provider } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const signup = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, phone, username, password, authProvider } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();
    const referralLink = generateReferralLink(username);

    const user = await prisma.user.create({
      data: {
        authProvider,
        email,
        phone,
        username,
        password: hashedPassword,
        referralLink,
        referralPoints: 0,
        apiKey,
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10d" });

    res.status(201).json({
      token,
      message: "User created",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
