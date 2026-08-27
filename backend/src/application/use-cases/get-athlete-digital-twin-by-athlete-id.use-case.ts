import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteDigitalTwinRepository } from "../../domain/repositories/athlete-digital-twin.repository";

import { AthleteDigitalTwinDto } from "../dto/athlete-digital-twin/athlete-digital-twin.dto";
import { AthleteDigitalTwinApplicationMapper } from "../mappers/athlete-digital-twin.mapper";

import { GetAthleteDigitalTwinByAthleteIdQuery } from "../queries/athlete-digital-twin/get-athlete-digital-twin-by-athlete-id.query";

export class GetAthleteDigitalTwinByAthleteIdUseCase
implements UseCase<GetAthleteDigitalTwinByAthleteIdQuery, Result<AthleteDigitalTwinDto>> {

    constructor(
        private readonly athleteDigitalTwinRepository: AthleteDigitalTwinRepository,
    ) {}

    async execute(
        query: GetAthleteDigitalTwinByAthleteIdQuery,
    ): Promise<Result<AthleteDigitalTwinDto>> {

        const twin =
            await this.athleteDigitalTwinRepository.findByAthleteId(
                query.athleteId,
                query.tenantId,
            );

        if (!twin) {

            return Result.failure(
                "Athlete Digital Twin not found.",
            );
        }

        return Result.success(
            AthleteDigitalTwinApplicationMapper.toDto(
                twin,
            ),
        );
    }

}
