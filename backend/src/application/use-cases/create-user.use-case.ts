import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";
import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { CreateUserCommand } from "../commands/create-user.command";
import { UserDto } from "../dto/user/user.dto";
import { UserApplicationMapper } from "../mappers/user.mapper";

import { passwordSecurity } from "../../security/bcrypt";

export class CreateUserUseCase
    implements UseCase<CreateUserCommand, Result<UserDto>>
{
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        command: CreateUserCommand,
    ): Promise<Result<UserDto>> {

        const tenant =
            await this.tenantRepository.findById(
                command.tenantId,
            );

        if (!tenant) {
            return Result.failure(
                "Tenant not found.",
            );
        }

        const existingUser =
            await this.userRepository.findByEmail(
                command.email,
            );

        if (
            existingUser &&
            existingUser.tenantId === command.tenantId
        ) {
            return Result.failure(
                "Email already exists for this tenant.",
            );
        }

        const passwordHash =
            await passwordSecurity.hash(
                command.password,
            );

        const user = User.create(
            command.tenantId,
            command.organisationId,
            command.email,
            passwordHash,
            command.firstName,
            command.lastName,
        );

        await this.userRepository.create(user);

        return Result.success(
            UserApplicationMapper.toDto(user),
        );

    }
}
