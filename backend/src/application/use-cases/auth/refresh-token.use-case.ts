import { UserRepository } from "../../../domain/repositories/user.repository";
import { SessionRepository } from "../../../domain/repositories/session.repository";
import { Session } from "../../../domain/entities/session.entity";
import { RefreshTokenCommand } from "./refresh-token.command";
import { jwtService } from "../../../security/jwt";
import { HttpException } from "../../../shared/exceptions/http.exception";

import {
    SecurityEventContext,
    SecurityEventService,
} from "../../services/security-event.service";


export class RefreshTokenUseCase {

    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly userRepository: UserRepository,
        private readonly securityEventService: SecurityEventService,
    ) {}


    async execute(command: RefreshTokenCommand) {

        const securityContext: SecurityEventContext = {
            ipAddress: command.ipAddress ?? null,
            userAgent: command.userAgent ?? null,
            requestId: command.requestId ?? null,
        };


        let payload;

        try {

            payload =
                jwtService.verifyRefreshToken(
                    command.refreshToken,
                );

        } catch {

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "INVALID_REFRESH_TOKEN",
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        const session =
            await this.sessionRepository.findByToken(
                command.refreshToken,
            );


        if (!session) {

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "SESSION_NOT_FOUND",
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        if (payload.userId !== session.userId) {

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "TOKEN_USER_MISMATCH",
                    sessionId:
                        session.id,
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        if (payload.jti !== session.jti) {

            const user =
                await this.userRepository.findById(
                    session.userId,
                );

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "TOKEN_JTI_MISMATCH",
                    sessionId:
                        session.id,
                    userId:
                        session.userId,
                },
                securityContext,
                user?.tenantId ?? null,
                session.userId,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        if (!session.isActive()) {

            await this.securityEventService.recordTokenReuseDetected(
                session.userId,
                {
                    reason:
                        "REVOKED_REFRESH_TOKEN_REUSE",
                    sessionId:
                        session.id,
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        const user =
            await this.userRepository.findById(
                session.userId,
            );


        if (!user) {

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "USER_NOT_FOUND",
                    sessionId:
                        session.id,
                    userId:
                        session.userId,
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        if (session.isExpired()) {

            await this.sessionRepository.revoke(
                session.id,
                session.userId,
                user.tenantId,
            );

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "REFRESH_TOKEN_EXPIRED",
                    sessionId:
                        session.id,
                    userId:
                        session.userId,
                },
                securityContext,
            );

            throw new HttpException(
                "Refresh token expired",
                401,
                "UNAUTHORIZED",
            );
        }


        if (!user.isActive()) {

            await this.sessionRepository.revoke(
                session.id,
                session.userId,
                user.tenantId,
            );

            await this.securityEventService.recordTokenRefreshFailure(
                {
                    reason:
                        "USER_NOT_ACTIVE",
                    sessionId:
                        session.id,
                    userId:
                        user.id,
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        const roles =
            await this.userRepository.findRoles(
                user.id,
                user.tenantId,
            );


        const roleNames =
            roles.map(
                role => role.name,
            );


        const accessToken =
            jwtService.generateAccessToken({
                userId:
                    user.id,
                tenantId:
                    user.tenantId,
                roles:
                    roleNames,
            });


        const generatedRefreshToken =
            jwtService.generateRefreshToken({
                userId:
                    user.id,
            });


        const newSession =
            Session.create(
                user.id,
                generatedRefreshToken.jti,
                generatedRefreshToken.token,
                new Date(
                    Date.now() +
                    7 * 24 * 60 * 60 * 1000,
                ),
            );


        const rotated =
            await this.sessionRepository.rotate(
                session.id,
                session.userId,
                newSession,
            );


        if (!rotated) {

            await this.securityEventService.recordTokenReuseDetected(
                session.userId,
                {
                    reason:
                        "REVOKED_REFRESH_TOKEN_REUSE",
                    sessionId:
                        session.id,
                },
                securityContext,
            );

            throw new HttpException(
                "Invalid refresh token",
                401,
                "UNAUTHORIZED",
            );
        }


        await this.securityEventService.recordTokenRefreshSuccess(
            user.id,
            {
                previousSessionId:
                    session.id,
                newSessionId:
                    newSession.id,
            },
            securityContext,
        );


        return {
            accessToken,
            refreshToken:
                generatedRefreshToken.token,
        };
    }
}


