-- Dedicated read grant for authorised Athlete recovery intelligence.
INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id",
       'recovery-tracking.read', 'recovery-tracking.read',
       'Read authorised Athlete recovery observations', NOW(), NOW()
FROM "Tenant" AS t
WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" AS p
    WHERE p."tenantId" = t."id" AND p."code" = 'recovery-tracking.read'
)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r
JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" = 'recovery-tracking.read'
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
