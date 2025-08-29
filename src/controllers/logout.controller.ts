import { Request, Response } from "express";
import prisma from "../config/prisma-client";

export const logout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const token = req.cookies?.auth_token;

    if (token) {
      try {
        await prisma.session.update({
          where: { token },
          data: { isActive: false },
        });
      } catch (err) {
        console.warn("⚠️ Invalid or expired token on logout:", err);
      }
    }

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
