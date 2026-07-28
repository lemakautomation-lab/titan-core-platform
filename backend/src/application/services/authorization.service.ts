import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

export class AuthorizationService {

    constructor(

        private readonly userRepository: UserRepository,

        private readonly roleRepository: RoleRepository,

    ) {}

    async hasPermission(

        userId: string,

        permissionName: string,

    ): Promise<boolean> {

        const roles =
            await this.userRepository.findRoles(
                userId,
            );

        if (roles.length === 0) {
            return false;
        }

        for (const role of roles) {

            const permissions =
                await this.roleRepository.findPermissions(
                    role.id,
                );

            const hasPermission =
                permissions.some(

                    permission =>

                        permission.name === permissionName,

                );

            if (hasPermission) {
                return true;
            }

        }

        return false;

    }

}
