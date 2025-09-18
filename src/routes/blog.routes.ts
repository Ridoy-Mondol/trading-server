import { Router } from "express";
import { writeBlog } from "../controllers/blog/write.controller";
import { fetchBlogs } from "../controllers/blog/fetch.controller";
import { fetchBlogById } from "../controllers/blog/fetchById.controller";

const router = Router();

router.post("/write", writeBlog);
router.get("/", fetchBlogs);
router.get("/:id", fetchBlogById);

export default router;
