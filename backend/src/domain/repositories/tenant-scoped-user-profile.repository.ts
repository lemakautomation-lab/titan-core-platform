import { User } from "../entities/user.entity";

export interface TenantScopedUserProfileRepository {

    findByIdInTenant(
        id: string,
        tenantId: string,
    ): Promise<User | null>;

    update(
        user: User,
    ): Promise<User>;

}
