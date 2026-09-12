import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
    assertSafeTestDatabaseConfiguration,
} from "../setup/database.setup";

const connectionString =
    assertSafeTestDatabaseConfiguration(
        process.env.DATABASE_URL,
    );

const adapter =
    new PrismaPg({
        connectionString,
    });


export const testPrisma =
    new PrismaClient({
        adapter,
    });
