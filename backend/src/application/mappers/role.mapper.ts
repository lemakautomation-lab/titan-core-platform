import { Role } from "../../domain/entities/role.entity";

import { RoleDto } from "../dto/role/role.dto";


export class RoleApplicationMapper {


    static toDto(
        role: Role,
    ): RoleDto {


        return new RoleDto(

            role.id,

            role.name,

            role.description,

            role.createdAt,

            role.updatedAt,

        );

    }


}
