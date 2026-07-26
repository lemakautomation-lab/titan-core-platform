import { RolePermission as PrismaRolePermission } from "../../generated/prisma/client";

import { RolePermission } from "../../domain/entities/role-permission.entity";


export class RolePermissionMapper {


    static toDomain(

        prisma: PrismaRolePermission,

    ): RolePermission {


        return RolePermission.restore(

            prisma.id,

            prisma.roleId,

            prisma.permissionId,

            prisma.createdAt,

        );

    }



    static toPersistence(

        rolePermission: RolePermission,

    ) {


        return {


            id: rolePermission.id,

            roleId: rolePermission.roleId,

            permissionId: rolePermission.permissionId,


        };

    }


}
