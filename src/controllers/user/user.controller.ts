import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";

export const getUser = async (req: Request, res: Response) => {
  try {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        authProvider: true,
        email: true,
        phone: true,
        username: true,
        photoUrl: true,
        xprWalletAddr: true,
        role: true,
        referralLink: true,
        referralPoints: true,
        apiKey: true,
        is2FAEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Error retrieving user" });
  }
};
