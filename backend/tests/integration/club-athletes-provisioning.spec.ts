import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { testPrisma } from "../helpers/prisma-test.client";

const code = "club.athletes.read";

describe("Mission 070.9 new-tenant permission provisioning", () => {
    it("dry runs, rejects foreign roles and applies an idempotent audited grant", async () => {
        const tenant = await testPrisma.tenant.create({ data: {
            name: "070.9 provisioning gate", slug: `gate-0709-${randomUUID()}`,
        } });
        const foreignTenant = await testPrisma.tenant.create({ data: {
            name: "070.9 foreign tenant", slug: `gate-0709-${randomUUID()}`,
        } });
        try {
            const role = await testPrisma.role.create({ data: {
                tenantId: tenant.id, name: "DIRECTOR",
            } });
            const foreignRole = await testPrisma.role.create({ data: {
                tenantId: foreignTenant.id, name: "DIRECTOR",
            } });
            const args = [
                "dist/scripts/provision-club-athletes-permission.js",
                "--tenant-id", tenant.id, "--role-id", role.id,
                "--change-id", "GATE-0709",
            ];
            const run = (flags: string[]) => execFileSync(process.execPath, flags, {
                cwd: process.cwd(), env: process.env, encoding: "utf8",
            });

            expect(run(args)).toContain("DRY RUN");
            expect(await testPrisma.permission.count({ where: { tenantId: tenant.id, code } })).toBe(0);

            expect(() => run([
                ...args.slice(0, 4), foreignRole.id, ...args.slice(5), "--apply",
            ])).toThrow();

            run([...args, "--apply"]);
            run([...args, "--apply"]);
            expect(await testPrisma.rolePermission.count({ where: {
                tenantId: tenant.id, roleId: role.id, permission: { code },
            } })).toBe(1);
            expect(await testPrisma.auditLog.count({ where: {
                tenantId: tenant.id, action: "CLUB_ATHLETES_PERMISSION_PROVISION",
            } })).toBe(2);
        } finally {
            await testPrisma.auditLog.deleteMany({ where: { tenantId: tenant.id } });
            await testPrisma.rolePermission.deleteMany({ where: { tenantId: tenant.id } });
            await testPrisma.permission.deleteMany({ where: { tenantId: tenant.id } });
            await testPrisma.role.deleteMany({ where: { tenantId: tenant.id } });
            await testPrisma.role.deleteMany({ where: { tenantId: foreignTenant.id } });
            await testPrisma.tenant.delete({ where: { id: tenant.id } });
            await testPrisma.tenant.delete({ where: { id: foreignTenant.id } });
        }
    });
});
