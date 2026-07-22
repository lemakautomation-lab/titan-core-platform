import { Session as PrismaSession } from "../../generated/prisma/client";
import { Session } from "../../domain/entities/session.entity";
import { SessionStatus } from "../../domain/enums/session-status.enum";

export class SessionMapper {

    static toDomain(prisma: PrismaSession): Session {

        return new Session(
            prisma.id,
            prisma.userId,
            prisma.refreshToken,
            prisma.status as SessionStatus,
            prisma.expiresAt,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        session: Session,
    ) {

        return {

            id: session.id,

            userId: session.userId,

            refreshToken: session.refreshToken,

            status: session.status,

            expiresAt: session.expiresAt,

        };

    }

}