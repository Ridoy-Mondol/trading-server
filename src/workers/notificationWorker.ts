import { Worker } from "bullmq";
import { connection } from "../config/redis";
import prisma from "../config/prisma-client";

const worker = new Worker(
  "notifications",
  async (job) => {
    const { userId, type, title, content } = job.data;

    console.log(`🔄 Processing notification job ${job.id} for user ${userId}`);

    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content,
        },
      });

      console.log(`✅ Notification created for user ${userId}: ${title}`);
      return { success: true, userId, title };
    } catch (error) {
      console.error(
        `❌ Failed to create notification for user ${userId}:`,
        error
      );
      throw error;
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err);
});

export default worker;
