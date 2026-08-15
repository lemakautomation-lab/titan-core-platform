import { User } from "../../domain/entities/user.entity";
import { Role } from "../../domain/entities/role.entity";

import { UserRepository } from "../../domain/repositories/user.repository";

import { DatabaseService } from "../database/database.service";

import { UserMapper } from "../mappers/user.mapper";
import { RoleMapper } from "../mappers/role.mapper";

export class PrismaUserRepository
implements UserRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
    ): Promise<User | null> {

        const user =
            await this.database.prisma.user.findUnique({
                where: { id },
            });

        return user
            ? UserMapper.toDomain(user)
            : null;
    }

    async findByEmail(
        email: string,
        tenantId: string,
    ): Promise<User | null> {

        const user =
            await this.database.prisma.user.findFirst({
                where: {
                    email,
                    tenantId,
                },
            });

        return user
            ? UserMapper.toDomain(user)
            : null;
    }

    async findByEmailAnyTenant(
        email: string,
    ): Promise<User | null> {

        const user =
            await this.database.prisma.user.findFirst({
                where: {
                    email,
                },
            });

        return user
            ? UserMapper.toDomain(user)
            : null;
    }

    async findAll(
        tenantId: string,
    ): Promise<User[]> {

        const users =
            await this.database.prisma.user.findMany({
                where: {
                    tenantId,
                },
            });

        return users.map(
            UserMapper.toDomain,
        );
    }

    async findAllByTenantId(
        tenantId: string,
    ): Promise<User[]> {

        return this.findAll(
            tenantId,
        );
    }

    async create(
        user: User,
    ): Promise<User> {

        const created =
            await this.database.prisma.user.create({
                data:
                    UserMapper.toPersistence(
                        user,
                    ),
            });

        return UserMapper.toDomain(
            created,
        );
    }

    async update(
        user: User,
    ): Promise<User> {

        const updated =
            await this.database.prisma.user.update({
                where: {
                    id: user.id,
                },
                data:
                    UserMapper.toPersistence(
                        user,
                    ),
            });

        return UserMapper.toDomain(
            updated,
        );
    }

    async delete(
        id: string,
    ): Promise<void> {

        await this.database.prisma.user.delete({
            where: {
                id,
            },
        });
    }

    async findRoles(
        userId: string,
        tenantId: string,
    ): Promise<Role[]> {

        const assignments =
            await this.database.prisma.userRole.findMany({

                where: {
                    userId,

                    user: {
                        tenantId,
                    },

                    role: {
                        tenantId,
                    },
                },

                include: {
                    role: true,
                },

            });

        return assignments.map(
            assignment =>
                RoleMapper.toDomain(
                    assignment.role,
                ),
        );
    }

    async assignRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.userRole.create({

            data: {
                userId,
                roleId,
            },

        });
    }

    async removeRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.userRole.delete({

            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },

        });
    }

    async hasRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<boolean> {

        const assignment =
            await this.database.prisma.userRole.findFirst({

                where: {
                    userId,
                    roleId,

                    user: {
                        tenantId,
                    },

                    role: {
                        tenantId,
                    },
                },

            });

        return !!assignment;
    }

}
