import { describe, expect, it, vi } from "vitest";

import {
    PermissionResolutionService,
} from "../../../../src/application/services/permission-resolution.service";

import {
    UserRepository,
} from "../../../../src/domain/repositories/user.repository";

import {
    RoleRepository,
} from "../../../../src/domain/repositories/role.repository";

describe("PermissionResolutionService", () => {
    it("inherits unique tenant permission codes from all roles", async () => {
        const userRepository = {
            findRoles: vi.fn().mockResolvedValue([
                { id: "role-a" },
                { id: "role-b" },
            ]),
        } as unknown as UserRepository;

        const roleRepository = {
            findPermissions: vi.fn().mockImplementation(
                async (roleId: string) =>
                    roleId === "role-a"
                        ? [
                            {
                                tenantId: "tenant-a",
                                code: "users.read",
                                name: "Users Read",
                            },
                        ]
                        : [
                            {
                                tenantId: "tenant-a",
                                code: "users.read",
                                name: "Renamed Read",
                            },
                            {
                                tenantId: "tenant-a",
                                code: "users.update",
                                name: "Users Update",
                            },
                            {
                                tenantId: "tenant-b",
                                code: "users.delete",
                                name: "Foreign Permission",
                            },
                        ],
            ),
        } as unknown as RoleRepository;

        const service = new PermissionResolutionService(
            userRepository,
            roleRepository,
        );

        await expect(
            service.getUserPermissions(
                "user-a",
                "tenant-a",
            ),
        ).resolves.toEqual([
            "users.read",
            "users.update",
        ]);

        expect(userRepository.findRoles)
            .toHaveBeenCalledWith(
                "user-a",
                "tenant-a",
            );

        expect(roleRepository.findPermissions)
            .toHaveBeenCalledTimes(2);

        expect(roleRepository.findPermissions)
            .toHaveBeenNthCalledWith(
                1,
                "role-a",
                "tenant-a",
            );

        expect(roleRepository.findPermissions)
            .toHaveBeenNthCalledWith(
                2,
                "role-b",
                "tenant-a",
            );
    });

    it("evaluates stable code instead of display name", async () => {
        const userRepository = {
            findRoles: vi.fn().mockResolvedValue([
                { id: "role-a" },
            ]),
        } as unknown as UserRepository;

        const roleRepository = {
            findPermissions: vi.fn().mockResolvedValue([
                {
                    tenantId: "tenant-a",
                    code: "roles.update",
                    name: "Renamed Role Administration",
                },
            ]),
        } as unknown as RoleRepository;

        const service = new PermissionResolutionService(
            userRepository,
            roleRepository,
        );

        await expect(
            service.hasPermission(
                "user-a",
                "tenant-a",
                "roles.update",
            ),
        ).resolves.toBe(true);

        await expect(
            service.hasPermission(
                "user-a",
                "tenant-a",
                "Renamed Role Administration",
            ),
        ).resolves.toBe(false);
    });
});
