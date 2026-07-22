import { User as PrismaUser } from "../../generated/prisma/client";
import { User } from "../../domain/entities/user.entity";
import { UserStatus } from "../../domain/enums/user-status.enum";

export class UserMapper {

    static toDomain(prisma: PrismaUser): User {

        return new User(
            prisma.id,
            prisma.tenantId,
            prisma.organisationId,
            prisma.email,
            prisma.passwordHash,
            prisma.firstName,
            prisma.lastName,
            prisma.status as UserStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        user: User,
    ) {

        return {

            id: user.id,

            tenantId: user.tenantId,

            organisationId: user.organisationId,

            email: user.email,

            passwordHash: user.passwordHash,

            firstName: user.firstName,

            lastName: user.lastName,

            status: user.status,

        };

    }

}