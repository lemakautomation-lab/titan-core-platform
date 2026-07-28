import { UserRepository } from "../../domain/repositories/user.repository";
import { GetUserRolesQuery } from "../queries/user/get-user-roles.query";


export class GetUserRolesUseCase {

    constructor(

        private readonly userRepository: UserRepository,

    ) {}


    async execute(
        query: GetUserRolesQuery,
    ) {

        const user =
            await this.userRepository.findById(
                query.userId,
            );


        if (!user) {

            return {

                isSuccess: false,

                error: "User not found",

            };

        }


        const roles =
            await this.userRepository.findRoles(
                query.userId,
            );


        return {

            isSuccess: true,

            value: roles.map(role => ({

                id: role.id,

                name: role.name,

                description: role.description,

            })),

        };

    }

}
