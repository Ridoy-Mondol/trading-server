import { Request, Response } from "express";
import prisma from "../../config/prisma-client";

export const fetchBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await prisma.blog.findUnique({
      where: { id: Number(id) },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json({
      message: "Blog fetched successfully",
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    return res.status(500).json({ message: "Error fetching blog by ID" });
  }
};
