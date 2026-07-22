import { Session } from "../../domain/entities/session.entity";
import { SessionRepository } from "../../domain/repositories/session.repository";

import { DatabaseService } from "../database/database.service";
import { SessionMapper } from "../mappers/session.mapper";

export class PrismaSessionRepository implements SessionRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<Session | null> {

        const session = await this.database.prisma.session.findUnique({
            where: { id },
        });

        return session
            ? SessionMapper.toDomain(session)
            : null;

    }

    async findByUserId(userId: string): Promise<Session[]> {

        const sessions = await this.database.prisma.session.findMany({
            where: { userId },
        });

        return sessions.map(SessionMapper.toDomain);

    }

    async findActiveByToken(token: string): Promise<Session | null> {

        const session = await this.database.prisma.session.findFirst({
            where: {
                refreshToken: token,
                status: "ACTIVE",
            },
        });

        return session
            ? SessionMapper.toDomain(session)
            : null;

    }

    async create(session: Session): Promise<Session> {

        const created = await this.database.prisma.session.create({
            data: SessionMapper.toPersistence(session),
        });

        return SessionMapper.toDomain(created);

    }

    async revoke(id: string): Promise<void> {

        await this.database.prisma.session.update({
            where: { id },
            data: {
                status: "REVOKED",
            },
        });

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.session.delete({
            where: { id },
        });

    }

}