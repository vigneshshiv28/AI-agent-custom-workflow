import type Redis from "ioredis";
import redis from "@/lib/db/redis";

export interface EventPublisher {
    publish(channel: string, data: unknown): Promise<void>;
}

export class RedisEventPublisher implements EventPublisher {
    constructor(private readonly redisClient: Redis = redis) { }

    async publish(channel: string, data: unknown): Promise<void> {
        await this.redisClient.publish(channel, JSON.stringify(data));
    }
}


export const publisher = new RedisEventPublisher(redis);