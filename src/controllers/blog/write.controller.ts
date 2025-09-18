import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma-client";
import { createNotification } from "../../services/notification.service";
import { NotificationType } from "@prisma/client";

export const writeBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, category, fileUrl } = req.body;

    if (!title || !content || !category || !fileUrl) {
      return res.status(400).json({
        message: "Title, content, category, and file are required",
      });
    }

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
      username: string;
    };

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = Number(decoded.id);

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        category,
        media: fileUrl,
        authorId: userId,
      },
    });

    const MAX_LENGTH = 160;
    const baseMessage =
      'Congratulations! Your new blog "" has been published successfully and is now visible to all users.';
    const allowedTitleLength = MAX_LENGTH - baseMessage.length + 2;
    const safeTitle =
      title.length > allowedTitleLength
        ? title.slice(0, allowedTitleLength - 3) + "..."
        : title;
    const notificationContent = `Congratulations! Your new blog "${safeTitle}" has been published successfully and is now visible to all users.`;

    await createNotification(
      userId,
      NotificationType.CONTENT as any,
      "Your Blog Has Been Published!",
      notificationContent
    );

    return res.status(201).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).json({ message: "Error creating blog" });
  }
};
