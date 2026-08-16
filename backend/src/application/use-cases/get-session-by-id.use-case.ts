import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { SessionRepository } from "../../domain/repositories/session.repository";

import { SessionDto } from "../dto/session/session.dto";

import { SessionApplicationMapper } from "../mappers/session.mapper";

import { GetSessionByIdQuery } from "../queries/session/get-session-by-id.query";


export class GetSessionByIdUseCase
implements UseCase<GetSessionByIdQuery, Result<SessionDto>>
{

    constructor(

        private readonly sessionRepository: SessionRepository,

    ) {}

    async execute(

        query: GetSessionByIdQuery,

    ): Promise<Result<SessionDto>> {

        const session =
            await this.sessionRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!session) {

            return Result.failure(
                "Session not found.",
            );

        }

        return Result.success(

            SessionApplicationMapper.toDto(
                session,
            ),

        );

    }

}
