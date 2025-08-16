import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const verifyAuth = (req: Request, res: Response) => {
  try {
    console.log("authentication api calls");

    const token = req.cookies.auth_token;
    if (token) {
      const user = jwt.verify(token, process.env.JWT_SECRET as string);
      return res.status(200).json({
        status: "authenticated",
        user,
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
