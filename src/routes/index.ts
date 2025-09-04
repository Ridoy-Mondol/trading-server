import { Router } from "express";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import googleRoutes from "./google.route";
import xprRoutes from "./xpr.routes";
import sessionRoutes from "./session.route";
import twoFARoutes from "./twoFA.routes";

const router = Router();

router.use("/", userRoutes);
router.use("/auth", authRoutes);
router.use("/auth/google", googleRoutes);
router.use("/xpr", xprRoutes);
router.use("/sessions", sessionRoutes);
router.use("/2fa", twoFARoutes);

export default router;
