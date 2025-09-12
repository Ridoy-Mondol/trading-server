import { Request, Response } from "express";
import prisma from "../../config/prisma-client";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  generateUsername,
  generateApiKey,
  generateReferralLink,
} from "../../utils/helpers";
import { verifyTransact } from "../../utils/verifyTransaction";
import { createSession } from "../../services/session.service";

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

    console.log("nonce from session", session.nonce);
    if (nonce !== session?.nonce) {
      return res.status(401).json({ message: "Invalid nonce" });
    }

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

    const username = await generateUsername(actor);
    const referralLink = generateReferralLink(username);
    const apiKey = generateApiKey();

    let user = await prisma.user.findUnique({
      where: { xprWalletAddr: actor },
    });
    if (!user) {
      const userCount = await prisma.user.count();
      let role: Role = Role.USER;
      if (userCount < 2) {
        role = Role.SUPERADMIN;
      }
      user = await prisma.user.create({
        data: {
          username,
          xprWalletAddr: actor,
          authProvider: "XPR",
          role,
          referralLink,
          apiKey,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    await createSession(req, { userId: user.id, token });

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
