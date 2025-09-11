import { Router } from "express";
import { getNotifications } from "../controllers/notifications/notification.controller";
import { markNotificationsRead } from "../controllers/notifications/markRead.controller";

const router = Router();

router.get("/", getNotifications);
router.patch("/mark-read", markNotificationsRead);

export default router;
