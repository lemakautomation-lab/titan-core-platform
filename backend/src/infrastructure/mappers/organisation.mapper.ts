import { Organisation as PrismaOrganisation } from "../../generated/prisma/client";
import { Organisation } from "../../domain/entities/organisation.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class OrganisationMapper {

    static toDomain(prisma: PrismaOrganisation): Organisation {

        return new Organisation(
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
        organisation: Organisation,
    ) {

        return {

            id: organisation.id,

            tenantId: organisation.tenantId,

            name: organisation.name,

            slug: organisation.slug,

            status: organisation.status,

        };

    }

}