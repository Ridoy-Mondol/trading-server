import { Router } from "express";
import { writeBlog } from "../controllers/blog/write.controller";
import { fetchBlogs } from "../controllers/blog/fetch.controller";

const router = Router();

router.post("/write", writeBlog);
router.get("/fetch", fetchBlogs);

export default router;
