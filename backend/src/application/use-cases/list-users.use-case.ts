import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";
import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { UserDto } from "../dto/user/user.dto";

import { ListUsersQuery } from "../queries/user/list-users.query";

import { UserApplicationMapper } from "../mappers/user.mapper";

export class ListUsersUseCase
    implements UseCase<ListUsersQuery, Result<UserDto[]>>
{

    constructor(
        private readonly userRepository: UserRepository,
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        query: ListUsersQuery,
    ): Promise<Result<UserDto[]>> {

        const tenant =
            await this.tenantRepository.findById(query.tenantId);

        if (!tenant) {
            return Result.failure("Tenant not found.");
        }

        const users =
            await this.userRepository.findAllByTenantId(
                query.tenantId,
            );

        return Result.success(
            users.map((user) =>
                UserApplicationMapper.toDto(user),
            ),
        );

    }

}
