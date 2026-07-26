import { DeletePermissionFromRoleCommand } from "../commands/delete-permission-from-role.command";

import { RoleRepository } from "../../domain/repositories/role.repository";
import { PermissionRepository } from "../../domain/repositories/permission.repository";
import { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";


export class DeletePermissionFromRoleUseCase {


    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly permissionRepository: PermissionRepository,

        private readonly rolePermissionRepository: RolePermissionRepository,

    ) {}



    async execute(

        command: DeletePermissionFromRoleCommand,

    ) {


        const role =

            await this.roleRepository.findById(

                command.roleId,

            );


        if (!role) {

            return {

                isSuccess: false,

                error: "Role not found.",

            };

        }



        const permission =

            await this.permissionRepository.findById(

                command.permissionId,

            );


        if (!permission) {

            return {

                isSuccess: false,

                error: "Permission not found.",

            };

        }



        const assignment =

            await this.rolePermissionRepository.findByRoleAndPermission(

                command.roleId,

                command.permissionId,

            );


        if (!assignment) {

            return {

                isSuccess: false,

                error: "Permission is not assigned to role.",

            };

        }



        await this.rolePermissionRepository.delete(

            command.roleId,

            command.permissionId,

        );



        return {

            isSuccess: true,

            value: true,

        };

    }

}
