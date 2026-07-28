import { AuthorizationService } from "../../application/services/authorization.service";
import { PermissionResolutionService } from "../../application/services/permission-resolution.service";

import { authModule } from "./auth.module";
import { roleModule } from "./role.module";


const permissionResolutionService =

    new PermissionResolutionService(

        authModule.userRepository,

        roleModule.roleRepository,

    );


export const authorizationModule = {


    authorizationService:

        new AuthorizationService(

            permissionResolutionService,

        ),


};
