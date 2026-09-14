import { SetUserProfilePictureCommand } from "../commands/set-user-profile-picture.command";
import { UserDto } from "../dto/user/user.dto";
import { UserApplicationMapper } from "../mappers/user.mapper";
import { Result } from "../common/result";
import { ProfilePictureStorageService } from "../../domain/services/profile-picture-storage.service";
import { TenantScopedUserProfileRepository } from "../../domain/repositories/tenant-scoped-user-profile.repository";

export class SetUserProfilePictureUseCase {

    constructor(
        private readonly userRepository:
            TenantScopedUserProfileRepository,
        private readonly storage:
            ProfilePictureStorageService,
    ) {}

    async execute(
        command: SetUserProfilePictureCommand,
    ): Promise<Result<UserDto>> {

        const user =
            await this.userRepository.findByIdInTenant(
                command.userId,
                command.tenantId,
            );

        if (!user) {
            return Result.failure(
                "User not found.",
            );
        }

        if (
            !(command.content instanceof Uint8Array) ||
            command.content.byteLength === 0 ||
            command.content.byteLength > 5 * 1024 * 1024
        ) {
            return Result.failure(
                "Profile picture exceeds the allowed size.",
            );
        }

        const mimeType =
            command.mimeType.trim().toLowerCase();

        if (
            mimeType !== "image/jpeg" &&
            mimeType !== "image/png" &&
            mimeType !== "image/webp"
        ) {
            return Result.failure(
                "Profile picture must be JPEG, PNG or WebP.",
            );
        }

        let stored;

        try {
            stored =
                await this.storage.store({
                    tenantId: command.tenantId,
                    userId: command.userId,
                    content: command.content,
                    mimeType,
                });

            user.updateProfilePicture(
                stored.storageKey,
                stored.mimeType,
                stored.sizeBytes,
            );

            const updated =
                await this.userRepository.update(
                    user,
                );

            return Result.success(
                UserApplicationMapper.toDto(
                    updated,
                ),
            );
        }
        catch (error) {

            if (stored) {
                try {
                    await this.storage.delete(
                        stored.storageKey,
                        command.tenantId,
                        command.userId,
                    );
                }
                catch {
                    // Storage cleanup must not conceal the primary failure.
                }
            }

            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Profile picture could not be stored.",
            );
        }
    }

}
