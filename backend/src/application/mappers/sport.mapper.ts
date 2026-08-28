import { Sport } from "../../domain/entities/sport.entity";

import { SportDto } from "../dto/sport/sport.dto";

export class SportApplicationMapper {

    static toDto(
        sport: Sport,
    ): SportDto {

        return new SportDto(

            sport.id,

            sport.tenantId,

            sport.name,

            sport.slug,

            sport.status,

            sport.createdAt,

            sport.updatedAt,

        );

    }

}
