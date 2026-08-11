import { Permission } from "../entities/permission.entity";

export interface PermissionRepository {

    findById(
        id: string,
        tenantId?: string,
    ): Promise<Permission | null>;

    findAll(): Promise<Permission[]>;

    findByName(
        name: string,
    ): Promise<Permission | null>;

    create(
        permission: Permission,
    ): Promise<Permission>;

    update(
        permission: Permission,
    ): Promise<Permission>;

    delete(
        id: string,
    ): Promise<void>;

}
