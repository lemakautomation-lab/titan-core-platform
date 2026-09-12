import { Permission as PrismaPermission } from "../../generated/prisma/client";

import { Permission } from "../../domain/entities/permission.entity";

export class PermissionMapper {

    static toDomain(

        prisma: PrismaPermission,

    ): Permission {

        return Permission.restore(

            prisma.id,

            prisma.tenantId,

            prisma.code,

            prisma.name,

            prisma.description,

            prisma.createdAt,

            prisma.updatedAt,

        );

    }


    static toPersistence(

        permission: Permission,

    ) {

        return {

            id: permission.id,

            tenantId: permission.tenantId,

            code: permission.getCode(),

            name: permission.name,

            description: permission.description,

        };

    }

}
