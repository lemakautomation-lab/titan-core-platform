import { AthleteDigitalTwin as PrismaAthleteDigitalTwin } from "../../generated/prisma/client";

import { AthleteDigitalTwin } from "../../domain/entities/athlete-digital-twin.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class AthleteDigitalTwinMapper {

    static toDomain(
        prisma: PrismaAthleteDigitalTwin,
    ): AthleteDigitalTwin {

        return new AthleteDigitalTwin(
            prisma.id,
            prisma.tenantId,
            prisma.athleteId,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        twin: AthleteDigitalTwin,
    ) {

        return {

            id: twin.id,

            tenantId: twin.tenantId,

            athleteId: twin.athleteId,

            status: twin.status,

        };

    }

}
