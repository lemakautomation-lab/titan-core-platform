import { UserRepository } from "../../../domain/repositories/user.repository";

import {
    AuditLogStatus,
} from "../../../domain/entities/audit-log.entity";

import { AuditAction } from "../../../domain/security/audit-action";

import { AuditResource } from "../../../domain/security/audit-resource";

import { AuditLogService } from "../../services/audit-log.service";

import { NotFoundException } from "../../../shared/exceptions/not-found.exception";

import { UnauthorizedException } from "../../../shared/exceptions/unauthorized.exception";


export class UnlockUserUseCase {


    constructor(

        private readonly userRepository: UserRepository,

        private readonly auditLogService: AuditLogService,

    ) {}



    async execute(

        tenantId: string,

        userId: string,

        actorUserId: string,

    ) {


        const user =

            await this.userRepository.findById(
                userId,
            );


        if (!user) {

            throw new NotFoundException(
                "User not found",
            );

        }



        if (user.tenantId !== tenantId) {

            throw new UnauthorizedException(
                "User does not belong to tenant",
            );

        }



        user.unlock();



        await this.userRepository.update(
            user,
        );



        await this.auditLogService.log(

            tenantId,

            actorUserId,

            AuditAction.ACCOUNT_UNLOCKED,

            AuditResource.USER,

            userId,

            AuditLogStatus.SUCCESS,

            {
                unlockedUserId: userId,
            },

        );



        return {

            id: user.id,

            email: user.email,

            status: user.status,

        };

    }

}
