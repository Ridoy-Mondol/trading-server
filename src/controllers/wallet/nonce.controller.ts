import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import crypto from "crypto";

interface CustomSessionData extends SessionData {
  nonce?: string;
}

interface SessionRequest extends Request {
  session: Session & CustomSessionData;
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const getNonce = async (req: Request, res: Response) => {
  try {
    console.log("[getNonce] Step 1: Generating nonce...");
    const sessionReq = req as SessionRequest;

    const nonce = generateNonce();
    console.log("[getNonce] Step 2: Nonce generated:", nonce);

    sessionReq.session.nonce = nonce;
    console.log("[getNonce] Session after setting nonce:", sessionReq.session);

    return res.status(200).json({ nonce });
  } catch (error) {
    console.error("Nonce error:", error);
    return res.status(500).json({ message: "Failed to generate nonce" });
  }
};
