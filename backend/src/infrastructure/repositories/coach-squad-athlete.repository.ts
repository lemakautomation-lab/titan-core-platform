import {
    CoachSquadAthleteMembership,
    CoachSquadAthleteRepository,
} from "../../domain/repositories/coach-squad-athlete.repository";
import { DatabaseService } from "../database/database.service";

export class PrismaCoachSquadAthleteRepository
implements CoachSquadAthleteRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async find(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<CoachSquadAthleteMembership | null> {
        return this.database.prisma.coachSquadAthlete.findFirst({
            where: {
                tenantId,
                squadId,
                athleteId,
            },
        });
    }

    async listForSquad(
        tenantId: string,
        squadId: string,
    ): Promise<CoachSquadAthleteMembership[]> {
        return this.database.prisma.coachSquadAthlete.findMany({
            where: {
                tenantId,
                squadId,
            },
            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
            ],
        });
    }

    async add(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<CoachSquadAthleteMembership> {
        return this.database.prisma.coachSquadAthlete.create({
            data: {
                tenantId,
                squadId,
                athleteId,
            },
        });
    }

    async remove(
        tenantId: string,
        squadId: string,
        athleteId: string,
    ): Promise<boolean> {
        const result =
            await this.database.prisma.coachSquadAthlete.deleteMany({
                where: {
                    tenantId,
                    squadId,
                    athleteId,
                },
            });

        return result.count === 1;
    }
}
