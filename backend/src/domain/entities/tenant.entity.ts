import { RecordStatus } from "../enums/record-status.enum";

export class Tenant {

    constructor(

        public readonly id: string,

        public name: string,

        public slug: string,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

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

    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

}