import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
    process.env.DATABASE_URL;

if (!connectionString) {

    throw new Error(
        "TEST DATABASE_URL is not defined"
    );

}

const adapter =
    new PrismaPg({
        connectionString,
    });


export const testPrisma =
    new PrismaClient({
        adapter,
    });
