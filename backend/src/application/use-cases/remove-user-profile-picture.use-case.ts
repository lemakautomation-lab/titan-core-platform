import { RemoveUserProfilePictureCommand } from "../commands/remove-user-profile-picture.command";
import { UserDto } from "../dto/user/user.dto";
import { UserApplicationMapper } from "../mappers/user.mapper";
import { Result } from "../common/result";
import { ProfilePictureStorageService } from "../../domain/services/profile-picture-storage.service";
import { TenantScopedUserProfileRepository } from "../../domain/repositories/tenant-scoped-user-profile.repository";

export class RemoveUserProfilePictureUseCase {

    constructor(
        private readonly userRepository:
            TenantScopedUserProfileRepository,
        private readonly storage:
            ProfilePictureStorageService,
    ) {}

    async execute(
        command: RemoveUserProfilePictureCommand,
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

        const previousStorageKey =
            user.profilePictureStorageKey;

        user.removeProfilePicture();

        try {
            const updated =
                await this.userRepository.update(
                    user,
                );

            if (previousStorageKey) {
                await this.storage.delete(
                    previousStorageKey,
                    command.tenantId,
                    command.userId,
                );
            }

            return Result.success(
                UserApplicationMapper.toDto(
                    updated,
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Profile picture could not be removed.",
            );
        }
    }

}
