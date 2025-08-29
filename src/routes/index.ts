import { Router } from "express";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import xprRoutes from "./xpr.routes";
import sessionRoutes from "./session.route";

const router = Router();

router.use("/", userRoutes);
router.use("/auth", authRoutes);
router.use("/xpr", xprRoutes);
router.use("/sessions", sessionRoutes);

export default router;
