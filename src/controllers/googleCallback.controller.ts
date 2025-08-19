import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prisma-client";
import jwt from "jsonwebtoken";
import {
  generateUsername,
  generateApiKey,
  generateReferralLink,
} from "../utils/helpers";

const oauthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

const FRONTEND_URL = process.env.FRONTEND_ORIGIN!;

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    console.log("Received query:", req.query);

    const cookieState = req.cookies?.oauth_state;
    console.log("Cookie state:", cookieState);

    if (!state || !cookieState || state !== cookieState) {
      return res.redirect(`${FRONTEND_URL}/sign-in?error=invalid_state`);
    }
    res.clearCookie("oauth_state");
    console.log("State verified and cookie cleared");

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/sign-in?error=no_code`);
    }

    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);
    console.log("Tokens received and credentials set:", tokens);

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("Payload verified:", payload);

    if (!payload?.email || !payload?.sub)
      return res.redirect(`${FRONTEND_URL}/sign-in?error=no_email`);

    const { email, name, picture, sub } = payload;

    const username = await generateUsername(email);
    const referralLink = generateReferralLink(username);
    const apiKey = generateApiKey();

    console.log("Name", name, username);

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: sub }, { email }] },
    });
    console.log("Existing user check result:", user);

    if (!user) {
      user = await prisma.user.create({
        data: {
          authProvider: "GOOGLE",
          email,
          username,
          photoUrl: picture || null,
          googleId: sub,
          referralLink,
          apiKey,
        },
      });
      console.log("Created new user:", user);
    } else if (user && !user.googleId) {
      console.log(
        "Email already exists but not linked to Google → cannot login"
      );
      return res.redirect(`${FRONTEND_URL}/sign-in?error=email_exists`);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/`);
  } catch (err) {
    console.error(err);
    res.redirect(`${FRONTEND_URL}/sign-in?error=google_login_failed`);
  }
};
