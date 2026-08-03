import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { DeleteRoleCommand } from "../commands/delete-role.command";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";


export class DeleteRoleUseCase
    implements UseCase<DeleteRoleCommand, Result<void>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

    ) {}


    async execute(

        command: DeleteRoleCommand,

    ): Promise<Result<void>> {


        const role =

            await this.roleRepository.findById(

                command.id,

            );


        if (!role) {


            return Result.failure(

                "Role not found.",

            );


        }


        await this.roleRepository.delete(

            command.id,

        );


        await this.auditLogService.log(

            command.tenantId,

            command.userId,

            "ROLE_DELETE",

            "ROLE",

            command.id,

            AuditLogStatus.SUCCESS,

        );


        return Result.success(

            undefined,

        );


    }

}
