import { Permission } from "../entities/permission.entity";

export interface PermissionRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Permission | null>;

    findAll(
        tenantId: string,
    ): Promise<Permission[]>;

    findByName(
        name: string,
        tenantId: string,
    ): Promise<Permission | null>;

    create(
        permission: Permission,
    ): Promise<Permission>;

    update(
        permission: Permission,
        tenantId: string,
    ): Promise<Permission>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

}
