export interface UserDto {

    id: string;

    tenantId: string;

    organisationId: string | null;

    email: string;

    firstName: string | null;

    lastName: string | null;

    status: string;

    createdAt: Date;

    updatedAt: Date;

}
