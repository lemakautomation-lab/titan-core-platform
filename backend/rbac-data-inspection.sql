SELECT "id", "name" FROM public."Tenant" ORDER BY "createdAt";

SELECT COUNT(*) AS role_count
FROM public."Role";

SELECT COUNT(*) AS permission_count
FROM public."Permission";

SELECT
    u."tenantId",
    COUNT(DISTINCT ur."roleId") AS role_count,
    COUNT(*) AS assignment_count
FROM public."UserRole" ur
JOIN public."User" u ON u."id" = ur."userId"
GROUP BY u."tenantId"
ORDER BY u."tenantId";

SELECT
    ur."roleId",
    r."name",
    COUNT(DISTINCT u."tenantId") AS tenant_count
FROM public."UserRole" ur
JOIN public."User" u ON u."id" = ur."userId"
JOIN public."Role" r ON r."id" = ur."roleId"
GROUP BY ur."roleId", r."name"
HAVING COUNT(DISTINCT u."tenantId") > 1
ORDER BY r."name";

SELECT
    r."id" AS "roleId",
    r."name" AS "roleName",
    u."tenantId",
    COUNT(*) AS assignments
FROM public."UserRole" ur
JOIN public."Role" r ON r."id" = ur."roleId"
JOIN public."User" u ON u."id" = ur."userId"
GROUP BY r."id", r."name", u."tenantId"
ORDER BY r."name", u."tenantId";

SELECT COUNT(*) AS unassigned_roles
FROM public."Role" r
WHERE NOT EXISTS (
    SELECT 1
    FROM public."UserRole" ur
    WHERE ur."roleId" = r."id"
);

SELECT COUNT(*) AS unassigned_permissions
FROM public."Permission" p
WHERE NOT EXISTS (
    SELECT 1
    FROM public."RolePermission" rp
    WHERE rp."permissionId" = p."id"
);
