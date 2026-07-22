import { Session } from "../entities/session.entity";

export interface SessionRepository {

    findById(id: string): Promise<Session | null>;

    findByUserId(userId: string): Promise<Session[]>;

    findActiveByToken(token: string): Promise<Session | null>;

    create(session: Session): Promise<Session>;

    revoke(id: string): Promise<void>;

    delete(id: string): Promise<void>;

}