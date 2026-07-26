import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { GetRolePermissionsQuery } from "../queries/role/get-role-permissions.query";

import { RoleRepository } from "../../domain/repositories/role.repository";
import { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";
import { PermissionRepository } from "../../domain/repositories/permission.repository";


export class GetRolePermissionsUseCase
implements UseCase<GetRolePermissionsQuery, Result<any[]>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly rolePermissionRepository: RolePermissionRepository,

        private readonly permissionRepository: PermissionRepository,

    ) {}


    async execute(

        query: GetRolePermissionsQuery,

    ): Promise<Result<any[]>> {


        const role =

            await this.roleRepository.findById(
                query.roleId,
            );


        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }


        const assignments =

            await this.rolePermissionRepository.findAllByRoleId(
                query.roleId,
            );


        const permissions = [];


        for (const assignment of assignments) {


            const permission =

                await this.permissionRepository.findById(
                    assignment.permissionId,
                );


            if (permission) {

                permissions.push({

                    id: permission.id,

                    name: permission.name,

                    description: permission.description,

                });

            }

        }


        return Result.success(
            permissions,
        );

    }

}
