import { SessionRepository } from "../../../domain/repositories/session.repository";
import { LogoutCommand } from "./logout.command";
import { UnauthorizedException } from "../../../shared/exceptions/unauthorized.exception";

import {
    SecurityEventContext,
    SecurityEventService,
} from "../../services/security-event.service";


export class LogoutUseCase {

    constructor(

        private readonly sessionRepository:
            SessionRepository,

        private readonly securityEventService:
            SecurityEventService,

    ) {}


    async execute(
        command: LogoutCommand,
    ): Promise<void> {

        const session =
            await this.sessionRepository.findByToken(
                command.refreshToken,
            );


        if (!session) {

            throw new UnauthorizedException(
                "Unauthorized session",
            );

        }


        if (
            session.userId !==
            command.userId
        ) {

            throw new UnauthorizedException(
                "Unauthorized session",
            );

        }


        if (!session.isActive()) {

            throw new UnauthorizedException(
                "Unauthorized session",
            );

        }


        if (session.isExpired()) {

            throw new UnauthorizedException(
                "Unauthorized session",
            );

        }


        const revoked =
            await this.sessionRepository.revoke(

                session.id,

                session.userId,

                command.tenantId,

            );


        if (!revoked) {

            throw new UnauthorizedException(
                "Unauthorized session",
            );

        }


        const securityContext:
            SecurityEventContext = {

                ipAddress:
                    command.ipAddress ?? null,

                userAgent:
                    command.userAgent ?? null,

                requestId:
                    command.requestId ?? null,

            };


        await this.securityEventService.recordSessionRevoked(

            command.userId,

            {

                sessionId:
                    session.id,

            },

            securityContext,

        );

    }

}
