import "dotenv/config";
import prisma from "../infrastructure/database/prisma.client";

const permissionCode = "club.scientists.read";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const readId = (flag: string): string => {
        const index = args.indexOf(flag);
        const value = args[index + 1];
        if (index < 0 || !value || !uuidPattern.test(value)) {
            throw new Error(`A valid ${flag} UUID is required.`);
        }
        return value;
    };
    const tenantId = readId("--tenant-id");
    const roleId = readId("--role-id");
    const changeIndex = args.indexOf("--change-id");
    const changeId = args[changeIndex + 1];
    if (changeIndex < 0 || !changeId ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/.test(changeId)) {
        throw new Error("A change reference (--change-id) is required.");
    }
    const apply = args.includes("--apply");
    const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw new Error("Role not found in the specified tenant.");

    if (!apply) {
        process.stdout.write(
            `DRY RUN (${changeId}): grant ${permissionCode} to role ${roleId} in tenant ${tenantId}. Add --apply to execute.\n`,
        );
        return;
    }

    await prisma.$transaction(async (tx) => {
        const permission = await tx.permission.upsert({
            where: { tenantId_code: { tenantId, code: permissionCode } },
            update: {},
            create: {
                tenantId, code: permissionCode, name: permissionCode,
                description: "Read own club sports scientist roster",
            },
        });
        await tx.rolePermission.upsert({
            where: { tenantId_roleId_permissionId: {
                tenantId, roleId, permissionId: permission.id,
            } },
            update: {},
            create: { tenantId, roleId, permissionId: permission.id },
        });
        await tx.auditLog.create({ data: {
            tenantId,
            action: "CLUB_SCIENTISTS_PERMISSION_PROVISION",
            resource: "ROLE_PERMISSION",
            resourceId: roleId,
            metadata: { permissionCode, changeId, execution: "DATABASE_OPERATOR" },
        } });
    });
    process.stdout.write(`Provisioned ${permissionCode} for tenant ${tenantId}.\n`);
}

main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Provisioning failed."}\n`);
    process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
