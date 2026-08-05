import { User } from "./user.model";
import { logger } from "../../logging/logger";


export class UserService {


    async getUserById(
        id: string,
    ): Promise<User | null> {


        logger.info(
            "User lookup by ID requested",
            {
                event: "USER_LOOKUP_BY_ID",
                identifierProvided: !!id,
            },
        );


        return null;

    }


    async getUserByEmail(
        email: string,
    ): Promise<User | null> {


        logger.info(
            "User lookup by email requested",
            {
                event: "USER_LOOKUP_BY_EMAIL",
                identifierProvided: !!email,
            },
        );


        return null;

    }

}


export const userService =
    new UserService();
