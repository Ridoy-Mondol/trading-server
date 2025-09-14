import { Router } from "express";
import { writeBlog } from "../controllers/blog/write.controller";

const router = Router();

router.post("/write", writeBlog);

export default router;
