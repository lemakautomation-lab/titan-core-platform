import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteDigitalTwinRepository } from "../../domain/repositories/athlete-digital-twin.repository";

import { AthleteDigitalTwinDto } from "../dto/athlete-digital-twin/athlete-digital-twin.dto";
import { AthleteDigitalTwinApplicationMapper } from "../mappers/athlete-digital-twin.mapper";

import { GetAthleteDigitalTwinByIdQuery } from "../queries/athlete-digital-twin/get-athlete-digital-twin-by-id.query";

export class GetAthleteDigitalTwinByIdUseCase
implements UseCase<GetAthleteDigitalTwinByIdQuery, Result<AthleteDigitalTwinDto>> {

    constructor(
        private readonly athleteDigitalTwinRepository: AthleteDigitalTwinRepository,
    ) {}

    async execute(
        query: GetAthleteDigitalTwinByIdQuery,
    ): Promise<Result<AthleteDigitalTwinDto>> {

        const twin =
            await this.athleteDigitalTwinRepository.findById(
                query.id,
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
