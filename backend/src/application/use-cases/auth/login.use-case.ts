import { UserRepository } from "../../../domain/repositories/user.repository";
import { SessionRepository } from "../../../domain/repositories/session.repository";

import { Session } from "../../../domain/entities/session.entity";

import { LoginCommand } from "./login.command";

import { passwordSecurity } from "../../../security/bcrypt";
import { jwtService } from "../../../security/jwt";

import { UnauthorizedException } from "../../../shared/exceptions/unauthorized.exception";

export class LoginUseCase {

    constructor(

        private readonly userRepository: UserRepository,

        private readonly sessionRepository: SessionRepository,

    ) {}

    async execute(
        command: LoginCommand,
    ) {

        const user =
            await this.userRepository.findByEmail(
                command.email,
            );

        if (!user) {
            throw new UnauthorizedException(
                "Invalid credentials",
            );
        }

        if (user.tenantId !== command.tenantId) {
            throw new UnauthorizedException(
                "Invalid credentials",
            );
        }

        const passwordValid =
            await passwordSecurity.verify(
                command.password,
                user.passwordHash,
            );

        if (!passwordValid) {
            throw new UnauthorizedException(
                "Invalid credentials",
            );
        }

        if (!user.isActive()) {
            throw new UnauthorizedException(
                "User account inactive",
            );
        }

        const roles =
            await this.userRepository.findRoles(
                user.id,
            );

        const roleNames =
            roles.map(
                role => role.name,
            );

        const accessToken =
            jwtService.generateAccessToken({

                userId: user.id,

                tenantId: user.tenantId,

                roles: roleNames,

            });

        const refreshToken =
            jwtService.generateRefreshToken({

                userId: user.id,

            });

        const expiresAt =
            new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            );

        const session =
            Session.create(
                user.id,
                refreshToken,
                expiresAt,
            );

        await this.sessionRepository.create(
            session,
        );

        return {

            user: {

                id: user.id,

                tenantId: user.tenantId,

                email: user.email,

                roles: roleNames,

            },

            accessToken,

            refreshToken,

        };

    }

}
