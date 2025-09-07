import { notificationQueue } from "../config/notificationQueue";

export const createNotification = async (
  userId: number,
  type:
    | "SECURITY"
    | "WALLET"
    | "TRADE"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "REFERRAL"
    | "API"
    | "NEWS"
    | "OTHER",
  title: string,
  content: string
) => {
  try {
    const job = await notificationQueue.add("createNotification", {
      userId,
      type,
      title,
      content,
    });
    console.log("Notification job added:", {
      jobId: job.id,
      userId,
      type,
      title,
    });
  } catch (err) {
    console.error("Failed to add notification job:", err);
  }
};
