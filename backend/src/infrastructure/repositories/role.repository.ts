import { Role } from "../../domain/entities/role.entity";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { DatabaseService } from "../database/database.service";
import { RoleMapper } from "../mappers/role.mapper";

export class PrismaRoleRepository implements RoleRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<Role | null> {

        const role = await this.database.prisma.role.findUnique({
            where: { id },
        });

        return role ? RoleMapper.toDomain(role) : null;

    }

    async findAll(): Promise<Role[]> {

        const roles = await this.database.prisma.role.findMany();

        return roles.map(RoleMapper.toDomain);

    }

    async findByName(name: string): Promise<Role | null> {

        const role = await this.database.prisma.role.findUnique({
            where: { name },
        });

        return role ? RoleMapper.toDomain(role) : null;

    }

    async create(role: Role): Promise<Role> {

        const created = await this.database.prisma.role.create({
            data: RoleMapper.toPersistence(role),
        });

        return RoleMapper.toDomain(created);

    }

    async update(role: Role): Promise<Role> {

        const updated = await this.database.prisma.role.update({
            where: {
                id: role.id,
            },
            data: RoleMapper.toPersistence(role),
        });

        return RoleMapper.toDomain(updated);

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.role.delete({
            where: {
                id,
            },
        });

    }

}