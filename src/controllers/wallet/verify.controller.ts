import { Request, Response } from "express";
import prisma from "../../config/prisma-client";
import { UAParser } from "ua-parser-js";
import jwt from "jsonwebtoken";
import {
  generateUsername,
  generateApiKey,
  generateReferralLink,
} from "../../utils/helpers";
import { getClientIP } from "../../utils/ip";
import { getLocationFromIP } from "../../utils/location";
import { verifyTransact } from "../../utils/verifyTransaction";

export const verifyWallet = async (req: Request, res: Response) => {
  try {
    console.log("[WalletController] Verify wallet API called");
    const session = req.session as any;

    const { actor, nonce, signatures, serializedTransaction } = req.body || {};

    console.log("body", req.body);

    if (
      !actor ||
      !nonce ||
      !Array.isArray(signatures) ||
      !serializedTransaction
    )
      return res.status(400).json({ message: "Missing required fields" });

    // 1) Session binding (pre-set during /nonce route)
    console.log("nonce from session", session.nonce);
    if (nonce !== session?.nonce) {
      return res.status(401).json({ message: "Invalid nonce" });
    }

    // 2) Off-chain verification
    const result = await verifyTransact({
      walletAddress: actor,
      nonce,
      signatures,
      signedTransactionHex: serializedTransaction,
    });

    if (!result.ok) {
      return res.status(401).json({
        message: `Invalid wallet verification: ${result.reason || "unknown"}`,
      });
    }

    // 3) Find or create user
    const username = await generateUsername(actor);
    const referralLink = generateReferralLink(username);
    const apiKey = generateApiKey();

    let user = await prisma.user.findUnique({
      where: { xprWalletAddr: actor },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          xprWalletAddr: actor,
          authProvider: "XPR",
          referralLink,
          apiKey,
        },
      });
    }

    // 4) JWT
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

    return res.status(200).json({ message: "Wallet verified", user });
  } catch (error) {
    console.error("Verify wallet error:", error);
    return res.status(500).json({ message: "Wallet verification failed" });
  }
};
