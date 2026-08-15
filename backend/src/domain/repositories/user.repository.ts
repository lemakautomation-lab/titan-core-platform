import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";

export interface UserRepository {

    findById(
        id: string,
    ): Promise<User | null>;

    findByEmail(
        email: string,
        tenantId: string,
    ): Promise<User | null>;

    findByEmailAnyTenant(
        email: string,
    ): Promise<User | null>;

    findAll(
        tenantId: string,
    ): Promise<User[]>;

    findAllByTenantId(
        tenantId: string,
    ): Promise<User[]>;

    findRoles(
        userId: string,
        tenantId: string,
    ): Promise<Role[]>;

    create(
        user: User,
    ): Promise<User>;

    update(
        user: User,
    ): Promise<User>;

    delete(
        id: string,
    ): Promise<void>;

    assignRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<void>;

    removeRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<void>;

    hasRole(
        userId: string,
        roleId: string,
        tenantId: string,
    ): Promise<boolean>;

}
