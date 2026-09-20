import { CoachSquad } from "../entities/coach-squad.entity";

export interface CoachSquadRepository {
    findById(
        id: string,
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachSquad | null>;

    listForCoach(
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachSquad[]>;

    create(
        squad: CoachSquad,
    ): Promise<CoachSquad>;

    update(
        squad: CoachSquad,
    ): Promise<CoachSquad>;
}
