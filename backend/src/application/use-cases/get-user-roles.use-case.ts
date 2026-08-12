import { UserRepository } from "../../domain/repositories/user.repository";
import { GetUserRolesQuery } from "../queries/user/get-user-roles.query";

import { AuditLogService } from "../services/audit-log.service";
import {
    AuditLogStatus,
} from "../../domain/entities/audit-log.entity";

export class GetUserRolesUseCase {

    constructor(
        private readonly userRepository: UserRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        query: GetUserRolesQuery,
    ) {

        const user =
            await this.userRepository.findById(
                query.userId,
            );

        if (!user) {

            return {
                isSuccess: false,
                error: "User not found",
            };
        }

        if (
            user.tenantId !==
            query.tenantId
        ) {

            return {
                isSuccess: false,
                error: "Forbidden.",
            };
        }

        const roles =
            await this.userRepository.findRoles(
                query.userId,
                query.tenantId,
            );

        await this.auditLogService.log(

            user.tenantId,
            user.id,
            "USER_ROLE_LIST",
            "USER_ROLE",
            query.userId,
            AuditLogStatus.SUCCESS,

        );

        return {

            isSuccess: true,

            value: roles.map(role => ({

                id: role.id,
                name: role.name,
                description: role.description,

            })),

        };
    }
}
