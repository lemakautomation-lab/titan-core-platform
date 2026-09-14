export interface UserDto {

    id: string;

    tenantId: string;

    organisationId: string | null;

    email: string;

    contactNumber: string | null;

    selectedUserType: string | null;

    firstName: string | null;

    lastName: string | null;

    status: string;

    createdAt: Date;

    updatedAt: Date;

}
