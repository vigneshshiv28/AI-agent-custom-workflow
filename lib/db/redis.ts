import Redis from "ioredis";

const redis = new Redis({
    host:Bun.env.REDIS_HOST
})

export default redis