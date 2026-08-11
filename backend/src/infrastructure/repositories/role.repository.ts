import { Role } from "../../domain/entities/role.entity";
import { Permission } from "../../domain/entities/permission.entity";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { DatabaseService } from "../database/database.service";

import { RoleMapper } from "../mappers/role.mapper";
import { PermissionMapper } from "../mappers/permission.mapper";

export class PrismaRoleRepository
implements RoleRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Role | null> {

        const role =
            await this.database.prisma.role.findFirst({

                where: {
                    id,
                    tenantId,
                },

            });

        return role
            ? RoleMapper.toDomain(role)
            : null;

    }

    async findAll(
        tenantId: string,
    ): Promise<Role[]> {

        const roles =
            await this.database.prisma.role.findMany({

                where: {
                    tenantId,
                },

                orderBy: {
                    name: "asc",
                },

            });

        return roles.map(
            RoleMapper.toDomain,
        );

    }

    async findByName(
        name: string,
        tenantId: string,
    ): Promise<Role | null> {

        const role =
            await this.database.prisma.role.findFirst({

                where: {
                    name,
                    tenantId,
                },

            });

        return role
            ? RoleMapper.toDomain(role)
            : null;

    }

    async create(
        role: Role,
    ): Promise<Role> {

        const created =
            await this.database.prisma.role.create({

                data:
                    RoleMapper.toPersistence(
                        role,
                    ),

            });

        return RoleMapper.toDomain(
            created,
        );

    }

    async update(
        role: Role,
        tenantId: string,
    ): Promise<Role> {

        const updated =
            await this.database.prisma.role.updateMany({

                where: {
                    id: role.id,
                    tenantId,
                },

                data:
                    RoleMapper.toPersistence(
                        role,
                    ),

            });

        if (updated.count !== 1) {

            throw new Error(
                "Role not found in tenant.",
            );

        }

        const persisted =
            await this.database.prisma.role.findFirst({

                where: {
                    id: role.id,
                    tenantId,
                },

            });

        if (!persisted) {

            throw new Error(
                "Role not found in tenant.",
            );

        }

        return RoleMapper.toDomain(
            persisted,
        );

    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        const deleted =
            await this.database.prisma.role.deleteMany({

                where: {
                    id,
                    tenantId,
                },

            });

        if (deleted.count !== 1) {

            throw new Error(
                "Role not found in tenant.",
            );

        }

    }

    async findPermissions(
        roleId: string,
        tenantId: string,
    ): Promise<Permission[]> {

        const assignments =
            await this.database.prisma.rolePermission.findMany({

                where: {

                    roleId,

                    role: {
                        tenantId,
                    },

                    permission: {
                        tenantId,
                    },

                },

                include: {
                    permission: true,
                },

            });

        return assignments.map(
            assignment =>
                PermissionMapper.toDomain(
                    assignment.permission,
                ),
        );

    }

}
