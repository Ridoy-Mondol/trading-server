import { Request, Response } from "express";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import prisma from "../../config/prisma-client";

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      username: string;
    };
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = Number(decoded.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.authProvider === "GOOGLE" || user.authProvider === "XPR") {
      const providerName = user.authProvider === "GOOGLE" ? "Google" : "XPR Network";
      return res.json({
        message:
          `Your account is already protected by ${providerName}. No additional security setup is needed.`,
      });
    }

    if (user.is2FAEnabled) {
      return res.json({ message: "2FA is already enabled" });
    }

    const secret = user.twoFASecret;

    if (secret) {
      const otpauthUrl = `otpauth://totp/XPRDex:${
        decoded.username || decoded.id
      }?secret=${secret}&issuer=XPRDex`;
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      return res.json({ qrCode });
    }

    const newSecret = speakeasy.generateSecret({
      name: `XPRDex (${decoded.username || decoded.id})`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: newSecret.base32 },
    });

    const qrCode = await QRCode.toDataURL(newSecret.otpauth_url!);

    return res.json({ qrCode });
  } catch (error) {
    return res.status(500).json({ message: "Error generating 2FA secret" });
  }
};
