import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { RoleDto } from "../dto/role/role.dto";

import { RoleApplicationMapper } from "../mappers/role.mapper";

import { ListRolesQuery } from "../queries/role/list-roles.query";


export class ListRolesUseCase
implements UseCase<ListRolesQuery, Result<RoleDto[]>>
{


    constructor(

        private readonly roleRepository: RoleRepository,

    ) {}



    async execute(

        query: ListRolesQuery,

    ): Promise<Result<RoleDto[]>> {


        void query;


        const roles =
            await this.roleRepository.findAll();



        return Result.success(

            roles.map(

                (role) =>
                    RoleApplicationMapper.toDto(
                        role,
                    ),

            ),

        );

    }


}
