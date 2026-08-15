import { UserRepository } from "../../../domain/repositories/user.repository";

import {
    AuditLogStatus,
} from "../../../domain/entities/audit-log.entity";

import { AuditAction } from "../../../domain/security/audit-action";

import { AuditResource } from "../../../domain/security/audit-resource";

import { AuditLogService } from "../../services/audit-log.service";

import { PermissionResolutionService } from "../../services/permission-resolution.service";

import { UnlockUserCommand } from "../../commands/unlock-user.command";

import { UserStatus } from "../../../domain/enums/user-status.enum";

import { NotFoundException } from "../../../shared/exceptions/not-found.exception";

import { UnauthorizedException } from "../../../shared/exceptions/unauthorized.exception";

import { ConflictException } from "../../../shared/exceptions/conflict.exception";

export class UnlockUserUseCase {

    constructor(

        private readonly userRepository: UserRepository,

        private readonly auditLogService: AuditLogService,

        private readonly permissionResolutionService:
            PermissionResolutionService,

    ) {}


    async execute(
        command: UnlockUserCommand,
    ) {

        const actorHasPermission =
            await this.permissionResolutionService.hasPermission(
                command.actorUserId,
                command.tenantId,
                "users.update",
            );

        if (!actorHasPermission) {

            throw new UnauthorizedException(
                "Forbidden",
            );

        }


        const user =
            await this.userRepository.findById(
                command.userId,
            );


        if (!user) {

            throw new NotFoundException(
                "User not found",
            );

        }


        if (
            user.tenantId !==
            command.tenantId
        ) {

            throw new UnauthorizedException(
                "User does not belong to tenant",
            );

        }


        if (
            user.status !==
            UserStatus.LOCKED
        ) {

            throw new ConflictException(
                "User is not locked",
            );

        }


        user.unlock();


        await this.userRepository.update(
            user,
        );


        await this.auditLogService.log(

            command.tenantId,

            command.actorUserId,

            AuditAction.ACCOUNT_UNLOCKED,

            AuditResource.USER,

            command.userId,

            AuditLogStatus.SUCCESS,

            {
                unlockedUserId:
                    command.userId,
            },

        );


        return {

            id: user.id,

            email: user.email,

            status: user.status,

        };

    }

}
