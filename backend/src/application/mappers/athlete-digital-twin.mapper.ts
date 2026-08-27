import { AthleteDigitalTwin } from "../../domain/entities/athlete-digital-twin.entity";

import { AthleteDigitalTwinDto } from "../dto/athlete-digital-twin/athlete-digital-twin.dto";

export class AthleteDigitalTwinApplicationMapper {

    static toDto(
        twin: AthleteDigitalTwin,
    ): AthleteDigitalTwinDto {

        return new AthleteDigitalTwinDto(
            twin.id,
            twin.tenantId,
            twin.athleteId,
            twin.status,
            twin.createdAt,
            twin.updatedAt,
        );

    }

}
