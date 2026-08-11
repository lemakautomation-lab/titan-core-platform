import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { GetRolePermissionsQuery } from "../queries/role/get-role-permissions.query";

import { RoleRepository } from "../../domain/repositories/role.repository";

export class GetRolePermissionsUseCase
implements UseCase<GetRolePermissionsQuery, Result<any[]>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

    ) {}

    async execute(
        query: GetRolePermissionsQuery,
    ): Promise<Result<any[]>> {

        const role =
            await this.roleRepository.findById(

                query.roleId,

                query.tenantId,

            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        const permissions =
            await this.roleRepository.findPermissions(

                query.roleId,

                query.tenantId,

            );

        return Result.success(

            permissions.map(
                permission => ({

                    id: permission.id,

                    name: permission.name,

                    description: permission.description,

                }),
            ),

        );

    }

}
