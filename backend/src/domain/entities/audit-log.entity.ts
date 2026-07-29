import { randomUUID } from "crypto";


export enum AuditLogStatus {

    SUCCESS = "SUCCESS",

    FAILURE = "FAILURE",

}


export class AuditLog {


    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly userId: string | null,

        public readonly action: string,

        public readonly resource: string,

        public readonly resourceId: string | null,

        public readonly status: AuditLogStatus,

        public readonly metadata: Record<string, any> | null,

        public readonly createdAt: Date,

    ) {}



    static create(

        tenantId: string,

        userId: string | null,

        action: string,

        resource: string,

        resourceId: string | null,

        status: AuditLogStatus,

        metadata?: Record<string, any> | null,

    ): AuditLog {


        return new AuditLog(

            randomUUID(),

            tenantId,

            userId,

            action,

            resource,

            resourceId,

            status,

            metadata ?? null,

            new Date(),

        );

    }


}
