import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { SetUserProfilePictureCommand } from "../../src/application/commands/set-user-profile-picture.command";
import { RemoveUserProfilePictureCommand } from "../../src/application/commands/remove-user-profile-picture.command";
import { SetUserProfilePictureUseCase } from "../../src/application/use-cases/set-user-profile-picture.use-case";
import { RemoveUserProfilePictureUseCase } from "../../src/application/use-cases/remove-user-profile-picture.use-case";
import { User } from "../../src/domain/entities/user.entity";
import { UserStatus } from "../../src/domain/enums/user-status.enum";
import { ProfilePictureStorageService } from "../../src/domain/services/profile-picture-storage.service";
import { TenantScopedUserProfileRepository } from "../../src/domain/repositories/tenant-scoped-user-profile.repository";

function createUser(): User {

    const now =
        new Date("2026-09-14T10:00:00.000Z");

    return new User(
        "user-1",
        "tenant-1",
        null,
        "athlete@titan.test",
        "password-hash",
        "Titan",
        "Athlete",
        UserStatus.ACTIVE,
        now,
        now,
    );
}

function createDependencies(
    user: User | null = createUser(),
) {

    const repository:
        TenantScopedUserProfileRepository = {
            findByIdInTenant: vi.fn(
                async (
                    userId: string,
                    tenantId: string,
                ) =>
                    user &&
                    user.id === userId &&
                    user.tenantId === tenantId
                        ? user
                        : null,
            ),
            update: vi.fn(
                async (updated: User) =>
                    updated,
            ),
        };

    const storage:
        ProfilePictureStorageService = {
            store: vi.fn(
                async () => ({
                    storageKey:
                        "tenants/tenant-1/users/user-1/profile.webp",
                    mimeType: "image/webp",
                    sizeBytes: 3,
                }),
            ),
            delete: vi.fn(
                async () => undefined,
            ),
        };

    return {
        repository,
        storage,
    };
}

describe(
    "User profile-picture application boundary",
    () => {

        it(
            "stores and persists a tenant-owned picture",
            async () => {

                const {
                    repository,
                    storage,
                } = createDependencies();

                const useCase =
                    new SetUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new SetUserProfilePictureCommand(
                            "user-1",
                            "tenant-1",
                            new Uint8Array([1, 2, 3]),
                            "image/webp",
                        ),
                    );

                expect(result.isSuccess).toBe(true);
                expect(storage.store).toHaveBeenCalledOnce();
                expect(repository.update).toHaveBeenCalledOnce();
            },
        );

        it(
            "does not reveal a User across tenants",
            async () => {

                const {
                    repository,
                    storage,
                } = createDependencies();

                const useCase =
                    new SetUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new SetUserProfilePictureCommand(
                            "user-1",
                            "tenant-2",
                            new Uint8Array([1]),
                            "image/webp",
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(storage.store).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects unsupported content before storage",
            async () => {

                const {
                    repository,
                    storage,
                } = createDependencies();

                const useCase =
                    new SetUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new SetUserProfilePictureCommand(
                            "user-1",
                            "tenant-1",
                            new Uint8Array([1]),
                            "image/svg+xml",
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(storage.store).not.toHaveBeenCalled();
            },
        );

        it(
            "deletes a newly stored object when persistence fails",
            async () => {

                const {
                    repository,
                    storage,
                } = createDependencies();

                repository.update = vi.fn(
                    async () => {
                        throw new Error(
                            "Persistence failed.",
                        );
                    },
                );

                const useCase =
                    new SetUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new SetUserProfilePictureCommand(
                            "user-1",
                            "tenant-1",
                            new Uint8Array([1, 2, 3]),
                            "image/webp",
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(storage.delete).toHaveBeenCalledWith(
                    "tenants/tenant-1/users/user-1/profile.webp",
                    "tenant-1",
                    "user-1",
                );
            },
        );

        it(
            "removes persisted metadata and stored content",
            async () => {

                const user=createUser();

                user.updateProfilePicture(
                    "tenants/tenant-1/users/user-1/profile.webp",
                    "image/webp",
                    3,
                );

                const {
                    repository,
                    storage,
                } = createDependencies(user);

                const useCase =
                    new RemoveUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new RemoveUserProfilePictureCommand(
                            "user-1",
                            "tenant-1",
                        ),
                    );

                expect(result.isSuccess).toBe(true);
                expect(storage.delete).toHaveBeenCalledOnce();
                expect(
                    user.profilePictureStorageKey,
                ).toBeNull();
            },
        );

        it(
            "does not call storage for a missing User",
            async () => {

                const {
                    repository,
                    storage,
                } = createDependencies(null);

                const useCase =
                    new RemoveUserProfilePictureUseCase(
                        repository,
                        storage,
                    );

                const result =
                    await useCase.execute(
                        new RemoveUserProfilePictureCommand(
                            "user-1",
                            "tenant-1",
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(storage.delete).not.toHaveBeenCalled();
            },
        );
    },
);
