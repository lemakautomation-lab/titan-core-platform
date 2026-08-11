import { Role } from "../../domain/entities/role.entity";
import { RoleDto } from "../dto/role/role.dto";
import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { UpdateRoleCommand } from "../commands/update-role.command";

import { RoleApplicationMapper } from "../mappers/role.mapper";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

export class UpdateRoleUseCase
implements UseCase<UpdateRoleCommand, Result<RoleDto>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

    ) {}

    async execute(
        command: UpdateRoleCommand,
    ): Promise<Result<RoleDto>> {

        const role =
            await this.roleRepository.findById(

                command.id,

                command.tenantId,

            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        const existingRole =
            await this.roleRepository.findByName(

                command.name,

                command.tenantId,

            );

        if (
            existingRole &&
            existingRole.id !== role.id
        ) {

            return Result.failure(
                "Role already exists.",
            );

        }

        role.rename(
            command.name,
        );

        role.updateDescription(
            command.description,
        );

        const updatedRole =
            await this.roleRepository.update(

                role,

                command.tenantId,

            );

        await this.auditLogService.log(

            command.tenantId,

            command.userId,

            "ROLE_UPDATE",

            "ROLE",

            command.id,

            AuditLogStatus.SUCCESS,

        );

        return Result.success(

            RoleApplicationMapper.toDto(
                updatedRole,
            ),

        );

    }

}










