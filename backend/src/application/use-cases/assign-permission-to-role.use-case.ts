import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";

import { RolePermission } from "../../domain/entities/role-permission.entity";

import { AssignPermissionToRoleCommand } from "../commands/assign-permission-to-role.command";


export class AssignPermissionToRoleUseCase

implements UseCase<AssignPermissionToRoleCommand, Result<void>>

{


    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly permissionRepository: PermissionRepository,

        private readonly rolePermissionRepository: RolePermissionRepository,

    ) {}



    async execute(

        command: AssignPermissionToRoleCommand,

    ): Promise<Result<void>> {



        const role =

            await this.roleRepository.findById(

                command.roleId,

            );



        if (!role) {

            return Result.failure(

                "Role not found.",

            );

        }



        const permission =

            await this.permissionRepository.findById(

                command.permissionId,

            );



        if (!permission) {

            return Result.failure(

                "Permission not found.",

            );

        }



        const existing =

            await this.rolePermissionRepository.findByRoleAndPermission(

                command.roleId,

                command.permissionId,

            );



        if (existing) {

            return Result.failure(

                "Permission already assigned to role.",

            );

        }



        const rolePermission =

            RolePermission.create(

                command.roleId,

                command.permissionId,

            );



        await this.rolePermissionRepository.create(

            rolePermission,

        );



        return Result.success(

            undefined,

        );

    }

}
