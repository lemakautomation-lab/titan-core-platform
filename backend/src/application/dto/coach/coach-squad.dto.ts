import { CoachSquad } from "../../../domain/entities/coach-squad.entity";

export interface CoachSquadDto {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export function toCoachSquadDto(
    squad: CoachSquad,
): CoachSquadDto {
    return {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        status: squad.status,
        createdAt: squad.createdAt.toISOString(),
        updatedAt: squad.updatedAt.toISOString(),
    };
}
