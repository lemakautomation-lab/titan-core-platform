import { SecurityEvent } from "../entities/security-event.entity";


export interface SecurityEventRepository {


    create(
        securityEvent: SecurityEvent,
    ): Promise<SecurityEvent>;


}
