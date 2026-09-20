import { CoachTeam } from "../entities/coach-team.entity";

export interface CoachTeamRepository {
    findById(
        id: string,
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachTeam | null>;

    listForCoach(
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachTeam[]>;

    create(
        squad: CoachTeam,
    ): Promise<CoachTeam>;

    update(
        squad: CoachTeam,
    ): Promise<CoachTeam>;
}
