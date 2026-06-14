import Redis from "ioredis";
import type { EventSubscriber } from "@/lib/events/workflow-bus";

const redis = new Redis({
  host: process.env.REDIS_HOST,
});

const subscriber = redis.duplicate();

export class RedisEventSubscriber implements EventSubscriber {
  constructor(private readonly subscriberClient: Redis) { }

  async subscribe(...channels: string[]): Promise<void> {
    await this.subscriberClient.subscribe(...channels);
  }

  onMessage(handler: (channel: string, data: unknown) => void): void {
    this.subscriberClient.on("message", (channel, message) => {
      try {
        handler(channel, JSON.parse(message));
      } catch {
        handler(channel, message);
      }
    });
  }

  async unsubscribe(...channels: string[]): Promise<void> {
    await this.subscriberClient.unsubscribe(...channels);
  }
}


export const redisSubscriber = new RedisEventSubscriber(subscriber);

export default redis;
