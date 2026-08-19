import { Session } from "../entities/session.entity";

export interface SessionRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Session | null>;

    findByUserId(userId: string): Promise<Session[]>;

    findByToken(token: string): Promise<Session | null>;

    findActiveByToken(token: string): Promise<Session | null>;

    create(session: Session): Promise<Session>;

    rotate(
        id: string,
        userId: string,
        successor: Session,
    ): Promise<boolean>;

    revoke(
        id: string,
        userId: string,
    ): Promise<void>;

    delete(id: string): Promise<void>;

}
