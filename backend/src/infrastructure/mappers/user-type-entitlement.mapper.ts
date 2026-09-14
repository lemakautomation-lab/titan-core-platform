import {
    UserTypeEntitlement as PrismaUserTypeEntitlement,
} from "../../generated/prisma/client";

import { UserTypeEntitlement } from "../../domain/entities/user-type-entitlement.entity";
import { EntitlementStatus } from "../../domain/enums/entitlement-status.enum";
import { OnboardingUserType } from "../../domain/enums/onboarding-user-type.enum";

export class UserTypeEntitlementMapper {

    static toDomain(
        prisma: PrismaUserTypeEntitlement,
    ): UserTypeEntitlement {

        return new UserTypeEntitlement(
            prisma.id,
            prisma.tenantId,
            prisma.userId,
            prisma.paymentId,
            prisma.productId,
            prisma.userType as OnboardingUserType,
            prisma.status as EntitlementStatus,
            prisma.validFrom,
            prisma.validUntil,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        entitlement: UserTypeEntitlement,
    ) {

        return {
            id: entitlement.id,
            tenantId: entitlement.tenantId,
            userId: entitlement.userId,
            paymentId: entitlement.paymentId,
            productId: entitlement.productId,
            userType: entitlement.userType,
            status: entitlement.status,
            validFrom: entitlement.validFrom,
            validUntil: entitlement.validUntil,
            createdAt: entitlement.createdAt,
            updatedAt: entitlement.updatedAt,
        };
    }

}
