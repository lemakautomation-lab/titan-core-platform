import { SessionRepository } from "../../../domain/repositories/session.repository";

import { Session } from "../../../domain/entities/session.entity";

import { RefreshTokenCommand } from "./refresh-token.command";

import { jwtService } from "../../../security/jwt";


export class RefreshTokenUseCase {


    constructor(

        private readonly sessionRepository: SessionRepository,

    ) {}


    async execute(
        command: RefreshTokenCommand,
    ) {


        const payload =
            jwtService.verifyRefreshToken(
                command.refreshToken,
            );


        const session =
            await this.sessionRepository.findActiveByToken(
                command.refreshToken,
            );


        if (!session) {

            throw new Error(
                "Invalid refresh token"
            );

        }


        if (session.isExpired()) {

            await this.sessionRepository.revoke(
                session.id,
            );


            throw new Error(
                "Refresh token expired"
            );

        }


        await this.sessionRepository.revoke(
            session.id,
        );


        const newAccessToken =
            jwtService.generateAccessToken({

                userId: payload.userId,

            });


        const newRefreshToken =
            jwtService.generateRefreshToken({

                userId: payload.userId,

            });


        const expiresAt =
            new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            );


        const newSession =
            Session.create(
                payload.userId,
                newRefreshToken,
                expiresAt,
            );


        await this.sessionRepository.create(
            newSession,
        );


        return {

            accessToken: newAccessToken,

            refreshToken: newRefreshToken,

        };


    }


}