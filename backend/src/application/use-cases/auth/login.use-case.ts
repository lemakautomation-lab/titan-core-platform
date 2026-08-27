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

import { AuditAction } from "../../../domain/security/audit-action";
import { AuditResource } from "../../../domain/security/audit-resource";

import { AuditLogService } from "../../services/audit-log.service";

import {
    SecurityEventContext,
    SecurityEventService,
} from "../../services/security-event.service";

import { SecurityAnalyticsService } from "../../services/security-analytics.service";
import { PermissionResolutionService } from "../../services/permission-resolution.service";

export class LoginUseCase {

    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly auditLogService: AuditLogService,
        private readonly securityEventService: SecurityEventService,
        private readonly securityAnalyticsService: SecurityAnalyticsService,
        private readonly permissionResolutionService: PermissionResolutionService,
    ) {}

    async execute(
        command: LoginCommand,
    ) {

        const securityContext: SecurityEventContext = {

            ipAddress:
                command.ipAddress ?? null,

            userAgent:
                command.userAgent ?? null,

            requestId:
                command.requestId ?? null,

        };


        const user =
            await this.userRepository.findByEmail(
                command.email,
                command.tenantId,
            );


        if (!user) {

            const userForSecurityEvent =
                await this.userRepository.findByEmailAnyTenant(
                    command.email,
                );


            if (userForSecurityEvent) {

                await this.securityEventService.recordAuthenticationFailure(

                    userForSecurityEvent.tenantId,

                    userForSecurityEvent.id,

                    {

                        email: userForSecurityEvent.email,

                        reason: "TENANT_MISMATCH",

                    },

                    securityContext,

                );

            } else {

                await this.securityEventService.recordAuthenticationFailure(

                    command.tenantId,

                    null,

                    {

                        email: command.email,

                        reason: "USER_NOT_FOUND",

                    },

                    securityContext,

                );

            }


            throw new UnauthorizedException(
                "Invalid credentials",
            );

        }


        if (user.tenantId !== command.tenantId) {

            await this.securityEventService.recordAuthenticationFailure(

                user.tenantId,

                user.id,

                {

                    email: user.email,

                    reason: "TENANT_MISMATCH",

                },

                securityContext,

            );


            throw new UnauthorizedException(
                "Invalid credentials",
            );

        }


        if (user.isLocked()) {

            await this.securityEventService.recordAccountLocked(

                user.tenantId,

                user.id,

                {

                    email: user.email,

                    reason: "ACCOUNT_ALREADY_LOCKED",

                },

                securityContext,

            );


            throw new UnauthorizedException(
                "Account locked",
            );

        }


        const passwordValid =
            await passwordSecurity.verify(
                command.password,
                user.passwordHash,
            );


        if (!passwordValid) {

            await this.securityEventService.recordAuthenticationFailure(

                user.tenantId,

                user.id,

                {

                    email: user.email,

                    reason: "INVALID_PASSWORD",

                },

                securityContext,
            );


            const thresholdExceeded =
                await this.securityAnalyticsService
                    .hasExceededFailedLoginThreshold(
                        user.tenantId,
                        user.email,
                    );


            if (thresholdExceeded) {

                user.lock();


                await this.userRepository.update(
                    user,
                );


                await this.securityEventService.recordAccountLocked(

                    user.tenantId,

                    user.id,

                    {

                        email: user.email,

                        reason:
                            "FAILED_LOGIN_THRESHOLD_EXCEEDED",

                    },

                    securityContext,
                );


                await this.auditLogService.log(

                    user.tenantId,

                    user.id,

                    AuditAction.ACCOUNT_LOCKED,

                    AuditResource.AUTHENTICATION,

                    null,

                    AuditLogStatus.FAILURE,

                );

            }


            throw new UnauthorizedException(
                "Invalid credentials",
            );

        }


        if (!user.isActive()) {

            await this.securityEventService.recordAuthenticationFailure(

                user.tenantId,

                user.id,

                {

                    email: user.email,

                    reason: "ACCOUNT_INACTIVE",

                },

                securityContext,

            );


            throw new UnauthorizedException(
                "User account inactive",
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


        const permissions =
            await this.permissionResolutionService.getUserPermissions(
                user.id,
                user.tenantId,
            );


        const accessToken =
            jwtService.generateAccessToken({

                userId: user.id,

                tenantId: user.tenantId,

                roles: roleNames,

            });


        const generatedRefreshToken =
            jwtService.generateRefreshToken({

                userId: user.id,

            });


        const refreshToken =
            generatedRefreshToken.token;

        const jti =
            generatedRefreshToken.jti;


        const expiresAt =
            new Date(
                Date.now() +
                7 * 24 * 60 * 60 * 1000,
            );


        const session =
            Session.create(
                user.id,
                jti,
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

            securityContext,

        );


        return {

            user: {

                id: user.id,

                tenantId: user.tenantId,

                email: user.email,

                roles: roleNames,

                permissions,

            },

            accessToken,

            refreshToken,

        };

    }

}


