import { Request } from "express";
import { UAParser } from "ua-parser-js";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma-client";
import { getClientIP } from "../utils/ip";
import { getLocationFromIP } from "../utils/location";

interface UserSessionInput {
  userId: number;
  token: string;
}

export const createSession = async (
  req: Request,
  { userId, token }: UserSessionInput
) => {
  const userAgent = req.headers["user-agent"] || "Unknown Device";
  const parser = new UAParser(userAgent);
  const osData = parser.getOS();
  const browserData = parser.getBrowser();

  const opSystem = osData.name
    ? `${osData.name} ${osData.version || ""}`.trim()
    : "Unknown OS";
  const browser = browserData.name
    ? `${browserData.name} ${browserData.version || ""}`.trim()
    : "Unknown Browser";

  const ipAddress = await getClientIP(req);
  const locationData = await getLocationFromIP(ipAddress);
  const location = locationData
    ? `${locationData.region}, ${locationData.country}`
    : null;

  const decoded = token ? (jwt.decode(token) as { exp?: number }) : null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      opSystem,
      browser,
      ipAddress,
      location,
    },
  });
};
