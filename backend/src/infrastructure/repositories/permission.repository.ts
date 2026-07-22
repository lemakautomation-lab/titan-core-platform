import { Permission } from "../../domain/entities/permission.entity";
import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { DatabaseService } from "../database/database.service";
import { PermissionMapper } from "../mappers/permission.mapper";

export class PrismaPermissionRepository implements PermissionRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<Permission | null> {

        const permission = await this.database.prisma.permission.findUnique({
            where: { id },
        });

        return permission
            ? PermissionMapper.toDomain(permission)
            : null;

    }

    async findAll(): Promise<Permission[]> {

        const permissions = await this.database.prisma.permission.findMany();

        return permissions.map(PermissionMapper.toDomain);

    }

    async findByName(name: string): Promise<Permission | null> {

        const permission = await this.database.prisma.permission.findUnique({
            where: { name },
        });

        return permission
            ? PermissionMapper.toDomain(permission)
            : null;

    }

    async create(permission: Permission): Promise<Permission> {

        const created = await this.database.prisma.permission.create({
            data: PermissionMapper.toPersistence(permission),
        });

        return PermissionMapper.toDomain(created);

    }

    async update(permission: Permission): Promise<Permission> {

        const updated = await this.database.prisma.permission.update({
            where: {
                id: permission.id,
            },
            data: PermissionMapper.toPersistence(permission),
        });

        return PermissionMapper.toDomain(updated);

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.permission.delete({
            where: {
                id,
            },
        });

    }

}