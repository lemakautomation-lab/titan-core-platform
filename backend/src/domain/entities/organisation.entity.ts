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

    ) {}


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


    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

}
