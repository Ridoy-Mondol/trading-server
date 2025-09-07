import Redis, { RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: "default",
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
  connectTimeout: 20000,
  commandTimeout: 10000,
  maxRetriesPerRequest: null,

  retryStrategy: (times: number): number | void => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const connection = new Redis(redisOptions);

connection.on("connect", () => {
  console.log("✅ Connected to Redis Cloud");
});

connection.on("ready", () => {
  console.log("✅ Redis is ready");
});

connection.on("error", (err: Error) => {
  console.error("❌ Redis error:", err.message);
});

connection.on("close", () => {
  console.log("🔌 Redis connection closed");
});

connection.on("reconnecting", (delay: number) => {
  console.log(`🔄 Reconnecting in ${delay}ms`);
});

export async function testConnection(): Promise<boolean> {
  try {
    const result = await connection.ping();
    console.log("✅ Connection test successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return false;
  }
}

export default connection;
