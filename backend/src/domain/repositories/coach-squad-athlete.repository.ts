export interface CoachSquadAthleteMembership {
    id: string;
    tenantId: string;
    squadId: string;
    athleteId: string;
    createdAt: Date;
}

export interface CoachSquadAthleteRepository {
    find(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<CoachSquadAthleteMembership | null>;

    listForSquad(
        tenantId: string,
        squadId: string,
    ): Promise<CoachSquadAthleteMembership[]>;

    add(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<CoachSquadAthleteMembership>;

    remove(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<boolean>;
}
