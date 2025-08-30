import { Request, Response } from "express";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "2FA token is required" });
    }

    const tokenCookie = req.cookies.auth_token;
    if (!tokenCookie) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET) as {
      id: string;
      username: string;
    };
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = Number(decoded.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.twoFASecret) {
      return res.status(400).json({ message: "2FA not initiated" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid 2FA code" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { is2FAEnabled: true },
    });

    return res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA verification error:", error);
    return res.status(500).json({ message: "Error verifying 2FA" });
  }
};
