import { UserTypeEntitlement } from "../../domain/entities/user-type-entitlement.entity";
import { OnboardingUserType } from "../../domain/enums/onboarding-user-type.enum";
import { UserTypeEntitlementRepository } from "../../domain/repositories/user-type-entitlement.repository";
import { DatabaseService } from "../database/database.service";
import { UserTypeEntitlementMapper } from "../mappers/user-type-entitlement.mapper";

export class PrismaUserTypeEntitlementRepository
implements UserTypeEntitlementRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<UserTypeEntitlement | null> {

        const entitlement =
            await this.database.prisma.userTypeEntitlement.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return entitlement
            ? UserTypeEntitlementMapper.toDomain(
                entitlement,
            )
            : null;
    }

    async findByPaymentId(
        paymentId: string,
        tenantId: string,
    ): Promise<UserTypeEntitlement | null> {

        const entitlement =
            await this.database.prisma.userTypeEntitlement.findFirst({
                where: {
                    paymentId,
                    tenantId,
                },
            });

        return entitlement
            ? UserTypeEntitlementMapper.toDomain(
                entitlement,
            )
            : null;
    }

    async findActive(
        userId: string,
        userType: OnboardingUserType,
        tenantId: string,
        at: Date,
    ): Promise<UserTypeEntitlement[]> {

        const entitlements =
            await this.database.prisma.userTypeEntitlement.findMany({
                where: {
                    userId,
                    userType,
                    tenantId,
                    status: "ACTIVE",
                    validFrom: {
                        lte: at,
                    },
                    OR: [
                        {
                            validUntil: null,
                        },
                        {
                            validUntil: {
                                gt: at,
                            },
                        },
                    ],
                },
                orderBy: [
                    {
                        validFrom: "desc",
                    },
                    {
                        createdAt: "desc",
                    },
                ],
            });

        return entitlements.map(
            UserTypeEntitlementMapper.toDomain,
        );
    }

    async create(
        entitlement: UserTypeEntitlement,
    ): Promise<UserTypeEntitlement> {

        const created =
            await this.database.prisma.userTypeEntitlement.create({
                data:
                    UserTypeEntitlementMapper.toPersistence(
                        entitlement,
                    ),
            });

        return UserTypeEntitlementMapper.toDomain(
            created,
        );
    }

    async update(
        entitlement: UserTypeEntitlement,
    ): Promise<UserTypeEntitlement> {

        const result =
            await this.database.prisma.userTypeEntitlement.updateMany({
                where: {
                    id: entitlement.id,
                    tenantId: entitlement.tenantId,
                },
                data:
                    UserTypeEntitlementMapper.toPersistence(
                        entitlement,
                    ),
            });

        if (result.count !== 1) {
            throw new Error(
                "Entitlement was not found in the tenant.",
            );
        }

        const updated =
            await this.findById(
                entitlement.id,
                entitlement.tenantId,
            );

        if (!updated) {
            throw new Error(
                "Entitlement could not be reloaded.",
            );
        }

        return updated;
    }

}
