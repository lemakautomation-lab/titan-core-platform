import { UserRepository } from "../../../domain/repositories/user.repository";
import { SessionRepository } from "../../../domain/repositories/session.repository";

import { Session } from "../../../domain/entities/session.entity";

import { LoginCommand } from "./login.command";

import { passwordSecurity } from "../../../security/bcrypt";
import { jwtService } from "../../../security/jwt";

import { UnauthorizedException } from "../../../shared/exceptions/unauthorized.exception";

import {
    AuditLogStatus,
} from "../../../domain/entities/audit-log.entity";

import { AuditLogService } from "../../services/audit-log.service";
import { SecurityEventService } from "../../services/security-event.service";


export class LoginUseCase {

    constructor(

        private readonly userRepository: UserRepository,

        private readonly sessionRepository: SessionRepository,

        private readonly auditLogService: AuditLogService,

        private readonly securityEventService: SecurityEventService,

    ) {}

    async execute(
        command: LoginCommand,
    ) {

        const user =
            await this.userRepository.findByEmail(
                command.email,
            );

        if (!user) {

            await this.auditLogService.log(
                command.tenantId,
                null,
                "USER_LOGIN",
                "AUTH",
                null,
                AuditLogStatus.FAILURE,
                {
                    email: command.email,
                },
            );

            await this.securityEventService.recordAuthenticationFailure(
                command.tenantId,
                null,
                {
                    email: command.email,
                    reason: "USER_NOT_FOUND",
                },
            );

            throw new UnauthorizedException(
                "Invalid credentials",
            );

        }

        if (user.tenantId !== command.tenantId) {

            await this.auditLogService.log(
                command.tenantId,
                user.id,
                "USER_LOGIN",
                "AUTH",
                null,
                AuditLogStatus.FAILURE,
            );

            await this.securityEventService.recordAuthenticationFailure(
                command.tenantId,
                user.id,
                {
                    email: user.email,
                    reason: "TENANT_MISMATCH",
                },
            );

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

            await this.auditLogService.log(
                user.tenantId,
                user.id,
                "USER_LOGIN",
                "AUTH",
                null,
                AuditLogStatus.FAILURE,
            );

            await this.securityEventService.recordAuthenticationFailure(
                user.tenantId,
                user.id,
                {
                    email: user.email,
                    reason: "INVALID_PASSWORD",
                },
            );

            throw new UnauthorizedException(
                "Invalid credentials",
            );

        }

        if (!user.isActive()) {

            await this.auditLogService.log(
                user.tenantId,
                user.id,
                "USER_LOGIN",
                "AUTH",
                null,
                AuditLogStatus.FAILURE,
            );

            await this.securityEventService.recordAuthenticationFailure(
                user.tenantId,
                user.id,
                {
                    email: user.email,
                    reason: "ACCOUNT_INACTIVE",
                },
            );

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

        await this.auditLogService.log(
            user.tenantId,
            user.id,
            "USER_LOGIN",
            "AUTH",
            session.id,
            AuditLogStatus.SUCCESS,
        );

        await this.securityEventService.recordAuthenticationSuccess(
            user.tenantId,
            user.id,
            {
                email: user.email,
            },
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




