import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma-client";

export const getSessions = async (req: Request, res: Response) => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: Number(decoded.id) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        location: true,
        browser: true,
        opSystem: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
