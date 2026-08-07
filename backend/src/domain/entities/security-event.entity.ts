import { randomUUID } from "crypto";

import { SecurityEventType } from "../security/security-event-type";


export class SecurityEvent {


    constructor(

        public readonly id: string,

        public readonly eventType: SecurityEventType,

        public readonly tenantId: string | null,

        public readonly userId: string | null,

        public readonly ipAddress: string | null,

        public readonly userAgent: string | null,

        public readonly requestId: string | null,

        public readonly metadata: Record<string, any> | null,

        public readonly createdAt: Date,

    ) {}


    static create(

        eventType: SecurityEventType,

        tenantId: string | null,

        userId: string | null,

        ipAddress: string | null,

        userAgent: string | null,

        requestId: string | null,

        metadata?: Record<string, any> | null,

    ): SecurityEvent {


        return new SecurityEvent(

            randomUUID(),

            eventType,

            tenantId,

            userId,

            ipAddress,

            userAgent,

            requestId,

            metadata ?? null,

            new Date(),

        );

    }


}
