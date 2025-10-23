import { Hono,Context } from "hono";
import redis from "@/lib/db/redis";
import prisma from "@/lib/db/prisma";

const app = new Hono()

app.post("/api/jobs/register", (c: Context)=>{
    return c.json({message: "job created successfully"})
})

export default{
    port: 8080,
    fetch: app.fetch
}