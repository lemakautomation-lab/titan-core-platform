import { SecurityEvent } from "../entities/security-event.entity";
import { SecurityEventType } from "../security/security-event-type";


export interface SecurityEventQuery {

    tenantId?: string;

    userId?: string;

    eventType?: SecurityEventType;

    from?: Date;

    to?: Date;

}



export interface SecurityEventRepository {


    create(
        securityEvent: SecurityEvent,
    ): Promise<SecurityEvent>;



    findMany(
        query: SecurityEventQuery,
    ): Promise<SecurityEvent[]>;



    findRecent(
        tenantId: string,
        from: Date,
    ): Promise<SecurityEvent[]>;



    countByType(
        tenantId: string,
        eventType: SecurityEventType,
        from: Date,
    ): Promise<number>;



}
