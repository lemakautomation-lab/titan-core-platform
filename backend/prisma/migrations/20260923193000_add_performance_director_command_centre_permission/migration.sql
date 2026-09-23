-- Explicit director grant for existing tenant administrators only.
INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id",
       'performance-director.command-centre.read',
       'performance-director.command-centre.read',
       'Read own department command centre', NOW(), NOW()
FROM "Tenant" AS t
WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" AS p
    WHERE p."tenantId" = t."id" AND p."code" = 'performance-director.command-centre.read'
)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r
JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" = 'performance-director.command-centre.read'
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
