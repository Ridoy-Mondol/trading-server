import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";

export const verifyAuth = async (req: Request, res: Response) => {
  try {
    console.log(`[Auth] verifyAuth endpoint hit`);

    const token = req.cookies.auth_token;

    if (token) {
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      } catch {
        return res.status(401).json({ status: "unauthorized" });
      }

      const session = await prisma.session.findUnique({
        where: { token },
        select: { isActive: true, userId: true },
      });

      if (!session || !session.isActive) {
        return res.status(401).json({ status: "unauthorized" });
      }

      return res.status(200).json({
        status: "authenticated",
        user: decoded,
      });
    }

    const pending = req.cookies.pending_signup;

    if (!pending) {
      return res.status(200).json({
        status: "signup_progress",
        step: 0,
      });
    }

    if (pending.otp) {
      return res.status(200).json({
        status: "signup_progress",
        step: 2,
      });
    }

    return res.status(200).json({
      status: "signup_progress",
      step: 1,
    });
  } catch (error) {
    return res.status(401).json({ status: "unauthorized" });
  }
};
