import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { Permission } from "../../domain/entities/permission.entity";
import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { CreatePermissionCommand } from "../commands/create-permission.command";
import { PermissionDto } from "../dto/permission/permission.dto";
import { PermissionApplicationMapper } from "../mappers/permission.mapper";

export class CreatePermissionUseCase
    implements UseCase<CreatePermissionCommand, Result<PermissionDto>>
{

    constructor(

        private readonly permissionRepository: PermissionRepository,

    ) {}

    async execute(

        command: CreatePermissionCommand,

    ): Promise<Result<PermissionDto>> {


        const existingPermission =
            await this.permissionRepository.findByName(
                command.name,
            );


        if (existingPermission) {

            return Result.failure(
                "Permission already exists.",
            );

        }


        const permission =
            Permission.create(

                command.name,

                command.name,

                command.description ?? "",

            );


        await this.permissionRepository.create(
            permission,
        );


        return Result.success(

            PermissionApplicationMapper.toDto(
                permission,
            ),

        );

    }

}
