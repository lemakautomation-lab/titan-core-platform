import { Session } from "../../domain/entities/session.entity";
import { SessionRepository } from "../../domain/repositories/session.repository";

import { DatabaseService } from "../database/database.service";
import { SessionMapper } from "../mappers/session.mapper";

export class PrismaSessionRepository implements SessionRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Session | null> {

        const session =
            await this.database.prisma.session.findFirst({
                where: {
                    id,
                    user: {
                        tenantId,
                    },
                },
            });

        return session
            ? SessionMapper.toDomain(session)
            : null;
    }

    async findByUserId(userId: string): Promise<Session[]> {

        const sessions =
            await this.database.prisma.session.findMany({
                where: {
                    userId,
                },
            });

        return sessions.map(SessionMapper.toDomain);
    }

    async findByToken(token: string): Promise<Session | null> {

        const session =
            await this.database.prisma.session.findUnique({
                where: {
                    refreshToken: token,
                },
            });

        return session
            ? SessionMapper.toDomain(session)
            : null;
    }

    async findActiveByToken(token: string): Promise<Session | null> {

        const session =
            await this.database.prisma.session.findFirst({
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

        const created =
            await this.database.prisma.session.create({
                data:
                    SessionMapper.toPersistence(
                        session,
                    ),
            });

        return SessionMapper.toDomain(created);
    }

    async rotate(
        id: string,
        userId: string,
        successor: Session,
    ): Promise<boolean> {

        return this.database.transaction(
            async (tx) => {

                const consumed =
                    await tx.session.updateMany({
                        where: {
                            id,
                            userId,
                            status: "ACTIVE",
                        },
                        data: {
                            status: "REVOKED",
                        },
                    });

                if (consumed.count !== 1) {
                    return false;
                }

                await tx.session.create({
                    data:
                        SessionMapper.toPersistence(
                            successor,
                        ),
                });

                return true;
            },
        );
    }

    async revoke(
        id: string,
        userId: string,
    ): Promise<void> {

        await this.database.prisma.session.updateMany({

            where: {
                id,
                userId,
            },

            data: {
                status: "REVOKED",
            },

        });
    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.session.delete({
            where: {
                id,
            },
        });
    }

}
