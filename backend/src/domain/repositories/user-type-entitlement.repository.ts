import { UserTypeEntitlement } from "../entities/user-type-entitlement.entity";
import { OnboardingUserType } from "../enums/onboarding-user-type.enum";

export interface UserTypeEntitlementRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<UserTypeEntitlement | null>;

    findByPaymentId(
        paymentId: string,
        tenantId: string,
    ): Promise<UserTypeEntitlement | null>;

    findActive(
        userId: string,
        userType: OnboardingUserType,
        tenantId: string,
        at: Date,
    ): Promise<UserTypeEntitlement[]>;

    create(
        entitlement: UserTypeEntitlement,
    ): Promise<UserTypeEntitlement>;

    update(
        entitlement: UserTypeEntitlement,
    ): Promise<UserTypeEntitlement>;

}
