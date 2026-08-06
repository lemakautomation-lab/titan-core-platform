import { SessionRepository } from "../../../domain/repositories/session.repository";
import { Session } from "../../../domain/entities/session.entity";
import { RefreshTokenCommand } from "./refresh-token.command";
import { jwtService } from "../../../security/jwt";
import { HttpException } from "../../../shared/exceptions/http.exception";

export class RefreshTokenUseCase {

    constructor(
        private readonly sessionRepository: SessionRepository,
    ) {}

    async execute(
        command: RefreshTokenCommand,
    ) {

        let payload;

        try {

            payload =
                jwtService.verifyRefreshToken(
                    command.refreshToken,
                );

        } catch {

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );

        }

        const session =
            await this.sessionRepository.findActiveByToken(
                command.refreshToken,
            );

        if (!session) {

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );

        }

        if (session.isExpired()) {

            await this.sessionRepository.revoke(
                session.id,
            );

            throw new HttpException(
                "Refresh token expired",
                401,
                "UNAUTHORIZED",
            );

        }

        await this.sessionRepository.revoke(
            session.id,
        );

        const accessToken =
            jwtService.generateAccessToken({

                userId: payload.userId,

            });

        const refreshToken =
            jwtService.generateRefreshToken({

                userId: payload.userId,

            });

        const expiresAt =
            new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            );

        const newSession =
            Session.create(
                payload.userId,
                refreshToken,
                expiresAt,
            );

        await this.sessionRepository.create(
            newSession,
        );

        return {

            accessToken,

            refreshToken,

        };

    }

}
