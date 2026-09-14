import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { PrismaUserRepository } from "../../src/infrastructure/repositories/user.repository";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database =
    new DatabaseService();

const repository =
    new PrismaUserRepository(
        database,
    );

let tenantId: string;
let otherTenantId: string;
let userId: string;

beforeAll(
    async () => {

        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Profile Picture Tenant ${crypto.randomUUID()}`,
                    slug:
                        `profile-picture-${crypto.randomUUID()}`,
                },
            });

        const otherTenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Other Profile Picture Tenant ${crypto.randomUUID()}`,
                    slug:
                        `other-profile-picture-${crypto.randomUUID()}`,
                },
            });

        tenantId = tenant.id;
        otherTenantId = otherTenant.id;

        const user =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `profile-picture-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                },
            });

        userId = user.id;
    },
);

afterAll(
    async () => {

        await testPrisma.user.deleteMany({
            where: {
                tenantId: {
                    in: [
                        tenantId,
                        otherTenantId,
                    ],
                },
            },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: [
                        tenantId,
                        otherTenantId,
                    ],
                },
            },
        });
    },
);

describe(
    "User profile-picture persistence",
    () => {

        it(
            "persists and reloads complete metadata",
            async () => {

                const user =
                    await repository.findByIdInTenant(
                        userId,
                        tenantId,
                    );

                expect(user).not.toBeNull();

                user?.updateProfilePicture(
                    `tenants/${tenantId}/users/${userId}/profile.webp`,
                    "image/webp",
                    2048,
                );

                await repository.update(
                    user!,
                );

                const reloaded =
                    await repository.findByIdInTenant(
                        userId,
                        tenantId,
                    );

                expect(
                    reloaded?.profilePictureStorageKey,
                ).toBe(
                    `tenants/${tenantId}/users/${userId}/profile.webp`,
                );

                expect(
                    reloaded?.profilePictureMimeType,
                ).toBe("image/webp");

                expect(
                    reloaded?.profilePictureSizeBytes,
                ).toBe(2048);
            },
        );

        it(
            "does not expose profile metadata across tenants",
            async () => {

                const user =
                    await repository.findByIdInTenant(
                        userId,
                        otherTenantId,
                    );

                expect(user).toBeNull();
            },
        );

        it(
            "rejects incomplete metadata at the database boundary",
            async () => {

                await expect(
                    testPrisma.user.update({
                        where: {
                            id: userId,
                        },
                        data: {
                            profilePictureStorageKey:
                                `tenants/${tenantId}/users/${userId}/invalid.webp`,
                            profilePictureMimeType: null,
                            profilePictureSizeBytes: null,
                        },
                    }),
                ).rejects.toThrow();
            },
        );
    },
);
