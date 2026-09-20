import { CoachTeam } from "../../../domain/entities/coach-team.entity";

export interface CoachTeamDto {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export function toCoachTeamDto(
    squad: CoachTeam,
): CoachTeamDto {
    return {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        status: squad.status,
        createdAt: squad.createdAt.toISOString(),
        updatedAt: squad.updatedAt.toISOString(),
    };
}
