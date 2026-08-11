import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not defined");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  console.log("\n===== TENANTS =====");
  console.table(await prisma.$queryRaw`
    SELECT id, name FROM "Tenant" ORDER BY name;
  `);

  console.log("\n===== ROLE TENANT USAGE =====");
  console.table(await prisma.$queryRaw`
    SELECT
      r.id AS "roleId",
      r.name AS "roleName",
      COUNT(ur."userId") AS "assignments",
      COUNT(DISTINCT u."tenantId") AS "tenants",
      STRING_AGG(DISTINCT u."tenantId", ', ') AS "tenantIds"
    FROM "Role" r
    LEFT JOIN "UserRole" ur ON ur."roleId" = r.id
    LEFT JOIN "User" u ON u.id = ur."userId"
    GROUP BY r.id, r.name
    ORDER BY r.name;
  `);

  console.log("\n===== CROSS-TENANT ROLES =====");
  console.table(await prisma.$queryRaw`
    SELECT
      r.id AS "roleId",
      r.name AS "roleName",
      COUNT(DISTINCT u."tenantId") AS "tenants",
      STRING_AGG(DISTINCT u."tenantId", ', ') AS "tenantIds"
    FROM "Role" r
    JOIN "UserRole" ur ON ur."roleId" = r.id
    JOIN "User" u ON u.id = ur."userId"
    GROUP BY r.id, r.name
    HAVING COUNT(DISTINCT u."tenantId") > 1
    ORDER BY r.name;
  `);

  console.log("\n===== PERMISSION TENANT USAGE =====");
  console.table(await prisma.$queryRaw`
    SELECT
      p.id AS "permissionId",
      p.name AS "permissionName",
      COUNT(DISTINCT rp."roleId") AS "roles",
      COUNT(DISTINCT u."tenantId") AS "tenants",
      STRING_AGG(DISTINCT u."tenantId", ', ') AS "tenantIds"
    FROM "Permission" p
    LEFT JOIN "RolePermission" rp ON rp."permissionId" = p.id
    LEFT JOIN "UserRole" ur ON ur."roleId" = rp."roleId"
    LEFT JOIN "User" u ON u.id = ur."userId"
    GROUP BY p.id, p.name
    ORDER BY p.name;
  `);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
