import { Organisation } from "../../domain/entities/organisation.entity";
import { OrganisationDto } from "../dto/organisation/organisation.dto";

export class OrganisationApplicationMapper {

    static toDto(
        organisation: Organisation,
    ): OrganisationDto {

        return new OrganisationDto(
            organisation.id,
            organisation.tenantId,
            organisation.name,
            organisation.slug,
            organisation.status.toString(),
            organisation.createdAt,
            organisation.updatedAt,
        );

    }

}
