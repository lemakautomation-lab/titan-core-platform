import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { Role } from "../../domain/entities/role.entity";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { CreateRoleCommand } from "../commands/create-role.command";
import { RoleDto } from "../dto/role/role.dto";
import { RoleApplicationMapper } from "../mappers/role.mapper";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";


export class CreateRoleUseCase
    implements UseCase<CreateRoleCommand, Result<RoleDto>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

    ) {}


    async execute(

        command: CreateRoleCommand,

    ): Promise<Result<RoleDto>> {


        const existingRole =
            await this.roleRepository.findByName(
                command.name,
            );


        if (existingRole) {

            return Result.failure(
                "Role already exists.",
            );

        }


        const role =
            Role.create(

                command.name,

                command.description,

            );


        await this.roleRepository.create(
            role,
        );


        await this.auditLogService.log(

            command.tenantId,

            command.userId,

            "ROLE_CREATE",

            "ROLE",

            role.id,

            AuditLogStatus.SUCCESS,

        );


        return Result.success(

            RoleApplicationMapper.toDto(
                role,
            ),

        );

    }

}
