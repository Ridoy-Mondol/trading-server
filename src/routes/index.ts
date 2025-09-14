import { Router } from "express";
import userRoutes from "./user.routes";
import signupRoutes from "./signup.routes";
import authRoutes from "./auth.routes";
import googleRoutes from "./google.route";
import xprRoutes from "./xpr.routes";
import sessionRoutes from "./session.route";
import twoFARoutes from "./twoFA.routes";
import passwordRoutes from "./password.routes";
import notificationRoutes from "./notification.routes";
import blogRoutes from "./blog.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/signup", signupRoutes);
router.use("/auth", authRoutes);
router.use("/auth/google", googleRoutes);
router.use("/xpr", xprRoutes);
router.use("/sessions", sessionRoutes);
router.use("/2fa", twoFARoutes);
router.use("/password", passwordRoutes);
router.use("/notification", notificationRoutes);
router.use("/blogs", blogRoutes);

export default router;
