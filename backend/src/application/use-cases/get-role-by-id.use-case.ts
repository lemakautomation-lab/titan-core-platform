import { Role } from "../../domain/entities/role.entity";
import { RoleDto } from "../dto/role/role.dto";
import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";


import { RoleApplicationMapper } from "../mappers/role.mapper";

import { GetRoleByIdQuery } from "../queries/role/get-role-by-id.query";

export class GetRoleByIdUseCase
implements UseCase<GetRoleByIdQuery, Result<RoleDto>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

    ) {}

    async execute(
        query: GetRoleByIdQuery,
    ): Promise<Result<RoleDto>> {

        const role =
            await this.roleRepository.findById(

                query.id,

                query.tenantId,

            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        return Result.success(

            RoleApplicationMapper.toDto(
                role,
            ),

        );

    }

}










