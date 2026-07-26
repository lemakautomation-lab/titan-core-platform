import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { UpdatePermissionCommand } from "../commands/update-permission.command";

import { PermissionDto } from "../dto/permission/permission.dto";
import { PermissionApplicationMapper } from "../mappers/permission.mapper";


export class UpdatePermissionUseCase
    implements UseCase<UpdatePermissionCommand, Result<PermissionDto>>
{

    constructor(

        private readonly permissionRepository: PermissionRepository,

    ) {}


    async execute(

        command: UpdatePermissionCommand,

    ): Promise<Result<PermissionDto>> {


        const permission =

            await this.permissionRepository.findById(

                command.id,

            );


        if (!permission) {

            return Result.failure(

                "Permission not found.",

            );

        }


        permission.rename(

            command.name,

        );


        permission.updateDescription(

            command.description,

        );


        const updatedPermission =

            await this.permissionRepository.update(

                permission,

            );


        return Result.success(

            PermissionApplicationMapper.toDto(

                updatedPermission,

            ),

        );


    }

}
