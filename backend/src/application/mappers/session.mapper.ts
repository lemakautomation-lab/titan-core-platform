import { Session } from "../../domain/entities/session.entity";

import { SessionDto } from "../dto/session/session.dto";

export class SessionApplicationMapper {

    static toDto(
        session: Session,
    ): SessionDto {

        return new SessionDto(

            session.id,

            session.userId,

            session.refreshToken,

            session.status,

            session.expiresAt,

            session.createdAt,

            session.updatedAt,

        );

    }

}
