import { Request, Response } from "express";
import prisma from "../../config/prisma-client";
import jwt from "jsonwebtoken";

export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
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
    };
    const userId = Number(decoded.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const updated = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: updated.count,
    });
  } catch (error) {
    console.error("❌ Failed to mark notifications as read:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
