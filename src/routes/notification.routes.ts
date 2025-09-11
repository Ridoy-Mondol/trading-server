import { Router } from "express";
import { getNotifications } from "../controllers/notifications/notification.controller";

const router = Router();

router.get("/", getNotifications);

export default router;
