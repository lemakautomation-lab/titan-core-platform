import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";

export interface RoleRepository {

    findById(id: string): Promise<Role | null>;

    findAll(): Promise<Role[]>;

    findByName(name: string): Promise<Role | null>;

    create(role: Role): Promise<Role>;

    update(role: Role): Promise<Role>;

    delete(id: string): Promise<void>;

    findPermissions(roleId: string): Promise<Permission[]>;

}
