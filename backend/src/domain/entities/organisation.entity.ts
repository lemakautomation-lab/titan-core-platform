import { RecordStatus } from "../enums/record-status.enum";

export class Organisation {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public name: string,

        public slug: string,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

        public parentOrganisationId: string | null = null,

    ) {

        if (
            parentOrganisationId !== null &&
            parentOrganisationId === id
        ) {
            throw new Error(
                "An Organisation cannot be its own parent.",
            );
        }

    }


    updateDetails(
        name: string,
        slug: string,
    ): void {

        this.name = name;
        this.slug = slug;
        this.updatedAt = new Date();

    }


    activate(): void {

        this.status = RecordStatus.ACTIVE;

    }


    deactivate(): void {

        this.status = RecordStatus.INACTIVE;

    }


    suspend(): void {

        this.status = RecordStatus.SUSPENDED;

    }


    delete(): void {

        this.status = RecordStatus.DELETED;

        this.updatedAt = new Date();

    }


    assignParent(
        parentOrganisationId: string,
    ): void {

        const normalizedParentId =
            parentOrganisationId.trim();

        if (!normalizedParentId) {
            throw new Error(
                "Parent Organisation ID is required.",
            );
        }

        if (normalizedParentId === this.id) {
            throw new Error(
                "An Organisation cannot be its own parent.",
            );
        }

        this.parentOrganisationId =
            normalizedParentId;

        this.updatedAt = new Date();

    }

    removeParent(): void {

        this.parentOrganisationId = null;
        this.updatedAt = new Date();

    }


    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

}
