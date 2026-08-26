import { Athlete as PrismaAthlete } from "../../generated/prisma/client";
import { Athlete } from "../../domain/entities/athlete.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class AthleteMapper {

    static toDomain(prisma: PrismaAthlete): Athlete {

        return new Athlete(
            prisma.id,
            prisma.tenantId,
            prisma.organisationId,
            prisma.userId,
            prisma.firstName,
            prisma.lastName,
            prisma.dateOfBirth,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        athlete: Athlete,
    ) {

        return {

            id: athlete.id,

            tenantId: athlete.tenantId,

            organisationId: athlete.organisationId,

            userId: athlete.userId,

            firstName: athlete.firstName,

            lastName: athlete.lastName,

            dateOfBirth: athlete.dateOfBirth,

            status: athlete.status,

        };

    }

}
