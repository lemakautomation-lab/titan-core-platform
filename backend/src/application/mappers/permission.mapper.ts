import { Permission } from "../../domain/entities/permission.entity";
import { PermissionDto } from "../dto/permission/permission.dto";


export class PermissionApplicationMapper {


    static toDto(
        permission: Permission,
    ): PermissionDto {

        return {

            id: permission.id,

            name: permission.name,

            description: permission.description,

            createdAt: permission.createdAt,

            updatedAt: permission.updatedAt,

        };

    }


}
