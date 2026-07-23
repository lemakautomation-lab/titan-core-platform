import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";

import { UserDto } from "../dto/user/user.dto";

import { GetUserByIdQuery } from "../queries/user/get-user-by-id.query";

import { UserApplicationMapper } from "../mappers/user.mapper";


export class GetUserByIdUseCase
    implements UseCase<GetUserByIdQuery, Result<UserDto>>
{

    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        query: GetUserByIdQuery,
    ): Promise<Result<UserDto>> {

        const user =
            await this.userRepository.findById(
                query.userId,
            );


        if (!user) {

            return Result.failure(
                "User not found.",
            );

        }


        return Result.success(
            UserApplicationMapper.toDto(user),
        );

    }

}
