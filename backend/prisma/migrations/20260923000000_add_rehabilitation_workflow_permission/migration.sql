-- Give the rehabilitation workflow a separately revocable, tenant-scoped grant.
-- Grant existing measurement-reader roles during the transition so deployed
-- professionals retain access; the active athlete relationship still applies.
INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id",
       'performance-professional.rehabilitation.read',
       'performance-professional.rehabilitation.read',
       'Read linked athlete rehabilitation workflow', NOW(), NOW()
FROM "Tenant" AS t
WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" AS p
    WHERE p."tenantId" = t."id"
      AND p."code" = 'performance-professional.rehabilitation.read'
)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", target."id", NOW()
FROM "Role" AS r
JOIN "Permission" AS target
  ON target."tenantId" = r."tenantId"
 AND target."code" = 'performance-professional.rehabilitation.read'
WHERE r."name" = 'ADMIN'
   OR EXISTS (
       SELECT 1 FROM "RolePermission" AS previous
       JOIN "Permission" AS source
         ON source."id" = previous."permissionId"
        AND source."tenantId" = previous."tenantId"
       WHERE previous."tenantId" = r."tenantId"
         AND previous."roleId" = r."id"
         AND source."code" = 'performance-measurements.read'
   )
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
