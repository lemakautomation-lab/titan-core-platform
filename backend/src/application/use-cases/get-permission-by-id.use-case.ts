import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { GetPermissionByIdQuery } from "../queries/permission/get-permission-by-id.query";

import { PermissionDto } from "../dto/permission/permission.dto";
import { PermissionApplicationMapper } from "../mappers/permission.mapper";

export class GetPermissionByIdUseCase
    implements UseCase<GetPermissionByIdQuery, Result<PermissionDto>>
{

    constructor(

        private readonly permissionRepository: PermissionRepository,

    ) {}

    async execute(

        query: GetPermissionByIdQuery,

    ): Promise<Result<PermissionDto>> {

        const permission =
            await this.permissionRepository.findById(
                query.id,
            );

        if (!permission) {

            return Result.failure(
                "Permission not found.",
            );

        }

        return Result.success(

            PermissionApplicationMapper.toDto(
                permission,
            ),

        );

    }

}
