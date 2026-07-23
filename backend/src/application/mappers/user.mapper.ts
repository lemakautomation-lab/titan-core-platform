import { User } from "../../domain/entities/user.entity";

import { UserDto } from "../dto/user/user.dto";

export class UserApplicationMapper {

    static toDto(
        user: User,
    ): UserDto {

        return {

            id: user.id,

            tenantId: user.tenantId,

            organisationId: user.organisationId,

            email: user.email,

            firstName: user.firstName,

            lastName: user.lastName,

            status: user.status,

            createdAt: user.createdAt,

            updatedAt: user.updatedAt,

        };

    }

}
