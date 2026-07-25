import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { Role } from "../../domain/entities/role.entity";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { CreateRoleCommand } from "../commands/create-role.command";
import { RoleDto } from "../dto/role/role.dto";
import { RoleApplicationMapper } from "../mappers/role.mapper";

export class CreateRoleUseCase
    implements UseCase<CreateRoleCommand, Result<RoleDto>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

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

        return Result.success(

            RoleApplicationMapper.toDto(
                role,
            ),

        );

    }

}
