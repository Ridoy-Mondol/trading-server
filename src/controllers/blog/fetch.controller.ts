import { Request, Response } from "express";
import prisma from "../../config/prisma-client";

export const fetchBlogs = async (req: Request, res: Response) => {
  try {
    const { category, search, page = "1", limit = "9", date = "recent" } = req.query;

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 9;

    const whereClause: any = {};

    if (category) {
      whereClause.category = String(category);
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { content: { contains: String(search), mode: "insensitive" } },
      ];
    }

    let orderByOption: any = { createdAt: "desc" };
    if (date === "oldest") {
      orderByOption = { createdAt: "asc" };
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        orderBy: orderByOption,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          author: {
            select: { id: true, username: true },
          },
        },
      }),
      prisma.blog.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      message: "Blogs fetched successfully",
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({ message: "Error fetching blogs" });
  }
};
