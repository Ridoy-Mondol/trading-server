import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const oauthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

export const googleLoginRedirect = (_: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, { httpOnly: true, maxAge: 10 * 60 * 1000, path: "/" });

  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    state,
  });

  res.redirect(url);
};
