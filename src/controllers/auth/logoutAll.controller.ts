import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";

export const logoutAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(200).json({ message: "Logout successful" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      console.warn("⚠️ Invalid or expired token on logoutAllSessions:", err);
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return res.status(200).json({ message: "Logout successful" });
    }

    await prisma.session.updateMany({
      where: { userId: decoded.id, isActive: true },
      data: { isActive: false },
    });

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout from all sessions successful",
    });
  } catch (err) {
    console.error("LogoutAllSessions error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
