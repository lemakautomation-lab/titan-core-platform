-- Dedicated club performance director roster permission for existing tenant administrators.
INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id",
       'club.directors.read',
       'club.directors.read',
       'Read own department own club performance director roster', NOW(), NOW()
FROM "Tenant" AS t
WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" AS p
    WHERE p."tenantId" = t."id" AND p."code" = 'club.directors.read'
)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r
JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" = 'club.directors.read'
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
