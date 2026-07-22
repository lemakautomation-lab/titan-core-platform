import { Role as PrismaRole } from "../../generated/prisma/client";
import { Role } from "../../domain/entities/role.entity";

export class RoleMapper {

    static toDomain(prisma: PrismaRole): Role {

        return new Role(
            prisma.id,
            prisma.name,
            prisma.description,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        role: Role,
    ) {

        return {

            id: role.id,

            name: role.name,

            description: role.description,

        };

    }

}