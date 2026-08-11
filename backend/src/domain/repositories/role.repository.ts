import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";

export interface RoleRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Role | null>;

    findAll(
        tenantId: string,
    ): Promise<Role[]>;

    findByName(
        name: string,
        tenantId: string,
    ): Promise<Role | null>;

    create(
        role: Role,
    ): Promise<Role>;

    update(
        role: Role,
        tenantId: string,
    ): Promise<Role>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

    findPermissions(
        roleId: string,
        tenantId: string,
    ): Promise<Permission[]>;

}
