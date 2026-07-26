import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { PermissionDto } from "../dto/permission/permission.dto";

import { PermissionApplicationMapper } from "../mappers/permission.mapper";

import { ListPermissionsQuery } from "../queries/permission/list-permissions.query";


export class ListPermissionsUseCase
implements UseCase<ListPermissionsQuery, Result<PermissionDto[]>>
{


    constructor(

        private readonly permissionRepository: PermissionRepository,

    ) {}


    async execute(

        query: ListPermissionsQuery,

    ): Promise<Result<PermissionDto[]>> {


        void query;


        const permissions =
            await this.permissionRepository.findAll();


        return Result.success(

            permissions.map(

                (permission) =>

                    PermissionApplicationMapper.toDto(
                        permission,
                    ),

            ),

        );

    }


}
