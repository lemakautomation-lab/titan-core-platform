import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { UpdateRoleCommand } from "../commands/update-role.command";

import { RoleDto } from "../dto/role/role.dto";
import { RoleApplicationMapper } from "../mappers/role.mapper";


export class UpdateRoleUseCase
    implements UseCase<UpdateRoleCommand, Result<RoleDto>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

    ) {}


    async execute(

        command: UpdateRoleCommand,

    ): Promise<Result<RoleDto>> {


        const role =

            await this.roleRepository.findById(

                command.id,

            );


        if (!role) {


            return Result.failure(

                "Role not found.",

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

            );


        return Result.success(

            RoleApplicationMapper.toDto(

                updatedRole,

            ),

        );


    }

}
