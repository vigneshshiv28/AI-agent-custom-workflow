import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DIRECT_URL}`;

const adapter = new PrismaPg({ connectionString });

const  prisma = new PrismaClient({ adapter });

export default prisma