import { AuthorizationService } from "../../application/services/authorization.service";

import { authModule } from "./auth.module";
import { roleModule } from "./role.module";

export const authorizationModule = {

    authorizationService:

        new AuthorizationService(

            authModule.userRepository,

            roleModule.roleRepository,

        ),

};
