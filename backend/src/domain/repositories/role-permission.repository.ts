import { RolePermission } from "../entities/role-permission.entity";

export interface RolePermissionRepository {

    create(
        rolePermission: RolePermission,
    ): Promise<RolePermission>;

    delete(
        roleId: string,
        permissionId: string,
        tenantId: string,
    ): Promise<void>;

    findByRoleAndPermission(
        roleId: string,
        permissionId: string,
        tenantId: string,
    ): Promise<RolePermission | null>;

    findAllByRoleId(
        roleId: string,
        tenantId: string,
    ): Promise<RolePermission[]>;
}
