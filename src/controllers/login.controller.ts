import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma-client";
import { Provider } from "@prisma/client";
import { getClientIP } from "../utils/ip";
import { getLocationFromIP } from "../utils/location";

export const login = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, phone, password, authProvider } = req.body;

    console.log(
      "➡️ Login request received:",
      req.body,
      email,
      phone,
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

    const cleanPhone = (num: string | null | undefined) => {
      return num ? num.replace(/[^\d]/g, "") : num;
    };

    const cleanedPhone = cleanPhone(phone);

    const user = await prisma.user.findFirst({
      where:
        authProvider === Provider.EMAIL ? { email } : { phone: cleanedPhone },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.clearCookie("pending_signup", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("signup_contact", { path: "/" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    const decoded = jwt.decode(token) as { exp?: number };
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ipAddress = await getClientIP(req);
    const parser = new UAParser(userAgent);
    const osData = parser.getOS();
    const browserData = parser.getBrowser();
    const locationData = await getLocationFromIP(ipAddress);

    const opSystem = osData.name
      ? `${osData.name} ${osData.version || ""}`.trim()
      : "Unknown OS";
    const browser = browserData.name
      ? `${browserData.name} ${browserData.version || ""}`.trim()
      : "Unknown Browser";
    const location = locationData
      ? `${locationData.region}, ${locationData.country}`
      : null;

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expiresAt,
        opSystem,
        browser,
        ipAddress,
        location,
      },
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      token,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
