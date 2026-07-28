import { PermissionResolutionService } from "./permission-resolution.service";


export class AuthorizationService {


    constructor(

        private readonly permissionResolutionService:
            PermissionResolutionService,

    ) {}



    async hasPermission(

        userId: string,

        permissionName: string,

    ): Promise<boolean> {


        return this.permissionResolutionService.hasPermission(

            userId,

            permissionName,

        );

    }


}
