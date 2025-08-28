import { Request } from "express";

export const getPublicIP = async (): Promise<string> => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = (await res.json()) as { ip: string };
    return data.ip;
  } catch (err) {
    console.error("Failed to get public IP:", err);
    return "0.0.0.0";
  }
};

export const getClientIP = async (req: Request): Promise<string> => {
  const xForwardedFor = req.headers["x-forwarded-for"] as string | undefined;

  const isLocalhost =
    xForwardedFor?.includes("127.0.0.1") || xForwardedFor?.includes("::1");

  if (isLocalhost || process.env.NODE_ENV === "development") {
    return await getPublicIP();
  }

  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return req.ip || "0.0.0.0";
};
