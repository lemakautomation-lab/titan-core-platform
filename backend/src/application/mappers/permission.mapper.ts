import { Permission } from "../../domain/entities/permission.entity";

import { PermissionDto } from "../dto/permission/permission.dto";

export class PermissionApplicationMapper {

    static toDto(
        permission: Permission,
    ): PermissionDto {

        return new PermissionDto(

            permission.id,

            permission.name,

            permission.description,

            permission.createdAt,

            permission.updatedAt,

        );

    }

}
