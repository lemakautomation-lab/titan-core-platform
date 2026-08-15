import { Permission } from "../../domain/entities/permission.entity";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { DatabaseService } from "../database/database.service";

import { PermissionMapper } from "../mappers/permission.mapper";

export class PrismaPermissionRepository
implements PermissionRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Permission | null> {

        const permission =
            await this.database.prisma.permission.findFirst({

                where: {
                    id,
                    tenantId,
                },

            });

        return permission
            ? PermissionMapper.toDomain(permission)
            : null;
    }

    async findAll(
        tenantId: string,
    ): Promise<Permission[]> {

        const permissions =
            await this.database.prisma.permission.findMany({

                where: {
                    tenantId,
                },

                orderBy: {
                    name: "asc",
                },

            });

        return permissions.map(
            PermissionMapper.toDomain,
        );
    }

    async findByName(
        name: string,
        tenantId: string,
    ): Promise<Permission | null> {

        const permission =
            await this.database.prisma.permission.findFirst({

                where: {
                    name,
                    tenantId,
                },

            });

        return permission
            ? PermissionMapper.toDomain(permission)
            : null;
    }

    async create(
        permission: Permission,
    ): Promise<Permission> {

        const created =
            await this.database.prisma.permission.create({

                data:
                    PermissionMapper.toPersistence(
                        permission,
                    ),

            });

        return PermissionMapper.toDomain(
            created,
        );
    }

    async update(
        permission: Permission,
        tenantId: string,
    ): Promise<Permission> {

        const updated =
            await this.database.prisma.permission.updateMany({

                where: {
                    id: permission.id,
                    tenantId,
                },

                data:
                    PermissionMapper.toPersistence(
                        permission,
                    ),

            });

        if (updated.count !== 1) {

            throw new Error(
                "Permission not found in tenant.",
            );
        }

        const persisted =
            await this.database.prisma.permission.findFirst({

                where: {
                    id: permission.id,
                    tenantId,
                },

            });

        if (!persisted) {

            throw new Error(
                "Permission not found in tenant.",
            );
        }

        return PermissionMapper.toDomain(
            persisted,
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        const deleted =
            await this.database.prisma.permission.deleteMany({

                where: {
                    id,
                    tenantId,
                },

            });

        if (deleted.count !== 1) {

            throw new Error(
                "Permission not found in tenant.",
            );
        }

        await this.database.prisma.rolePermission.deleteMany({

            where: {
                permissionId: id,

                permission: {
                    tenantId,
                },

                role: {
                    tenantId,
                },
            },

        });
    }

}
