import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

export class PermissionResolutionService {

    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async getUserPermissions(
        userId: string,
        tenantId: string,
    ): Promise<string[]> {

        const roles =
            await this.userRepository.findRoles(
                userId,
                tenantId,
            );

        const permissions = new Set<string>();

        for (const role of roles) {

            const rolePermissions =
                await this.roleRepository.findPermissions(
                    role.id,
                    tenantId,
                );

            for (const permission of rolePermissions) {

                if (
                    permission.tenantId === tenantId
                ) {

                    permissions.add(
                        permission.name,
                    );
                }
            }
        }

        return Array.from(
            permissions,
        );
    }

    async hasPermission(
        userId: string,
        tenantId: string,
        permissionName: string,
    ): Promise<boolean> {

        const permissions =
            await this.getUserPermissions(
                userId,
                tenantId,
            );

        return permissions.includes(
            permissionName,
        );
    }
}
