import { Request, Response } from "express";
import prisma from "../../config/prisma-client";
import jwt from "jsonwebtoken";

export const getNotifications = async (req: Request, res: Response) => {
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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filters: string[] | undefined = undefined;
    if (req.query.filters) {
      filters = (req.query.filters as string)
        .split(",")
        .map((f) => f.trim().toUpperCase());
    }

    const whereClause: any = { userId };
    if (filters && filters.length > 0) {
      whereClause.type = { in: filters };
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    console.error("❌ Failed to fetch notifications:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
