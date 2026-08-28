import { Sport as PrismaSport } from "../../generated/prisma/client";

import { Sport } from "../../domain/entities/sport.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class SportMapper {

    static toDomain(
        prisma: PrismaSport,
    ): Sport {

        return new Sport(
            prisma.id,
            prisma.tenantId,
            prisma.name,
            prisma.slug,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        sport: Sport,
    ) {

        return {

            id: sport.id,

            tenantId: sport.tenantId,

            name: sport.name,

            slug: sport.slug,

            status: sport.status,

        };
    }
}
