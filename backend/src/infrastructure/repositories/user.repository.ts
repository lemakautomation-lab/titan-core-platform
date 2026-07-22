import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";

import { DatabaseService } from "../database/database.service";
import { UserMapper } from "../mappers/user.mapper";

export class PrismaUserRepository implements UserRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<User | null> {

        const user = await this.database.prisma.user.findUnique({
            where: { id },
        });

        return user ? UserMapper.toDomain(user) : null;

    }

    async findByEmail(email: string): Promise<User | null> {

        const user = await this.database.prisma.user.findFirst({
            where: { email },
        });

        return user ? UserMapper.toDomain(user) : null;

    }

    async findAllByTenantId(
        tenantId: string,
    ): Promise<User[]> {

        const users = await this.database.prisma.user.findMany({
            where: { tenantId },
        });

        return users.map(UserMapper.toDomain);

    }

    async create(user: User): Promise<User> {

        const created = await this.database.prisma.user.create({
            data: UserMapper.toPersistence(user),
        });

        return UserMapper.toDomain(created);

    }

    async update(user: User): Promise<User> {

        const updated = await this.database.prisma.user.update({
            where: {
                id: user.id,
            },
            data: UserMapper.toPersistence(user),
        });

        return UserMapper.toDomain(updated);

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.user.delete({
            where: {
                id,
        },
    });

    }

}