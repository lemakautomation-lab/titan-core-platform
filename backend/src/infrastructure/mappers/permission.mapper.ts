import { Permission as PrismaPermission } from "../../generated/prisma/client";
import { Permission } from "../../domain/entities/permission.entity";

export class PermissionMapper {

    static toDomain(prisma: PrismaPermission): Permission {

        return new Permission(
            prisma.id,
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

            name: permission.name,

            description: permission.description,

        };

    }

}