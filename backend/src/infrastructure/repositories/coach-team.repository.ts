import { CoachTeam } from "../../domain/entities/coach-team.entity";
import { CoachTeamRepository } from "../../domain/repositories/coach-team.repository";
import { DatabaseService } from "../database/database.service";
import { CoachTeamMapper } from "../mappers/coach-team.mapper";

export class PrismaCoachTeamRepository
implements CoachTeamRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachTeam | null> {
        const record =
            await this.database.prisma.coachTeam.findFirst({
                where: {
                    id,
                    tenantId,
                    coachUserId,
                },
            });

        return record
            ? CoachTeamMapper.toDomain(record)
            : null;
    }

    async listForCoach(
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachTeam[]> {
        const records =
            await this.database.prisma.coachTeam.findMany({
                where: {
                    tenantId,
                    coachUserId,
                },
                orderBy: [
                    { name: "asc" },
                    { id: "asc" },
                ],
            });

        return records.map(CoachTeamMapper.toDomain);
    }

    async create(
        squad: CoachTeam,
    ): Promise<CoachTeam> {
        const created =
            await this.database.prisma.coachTeam.create({
                data: CoachTeamMapper.toPersistence(squad),
            });

        return CoachTeamMapper.toDomain(created);
    }

    async update(
        squad: CoachTeam,
    ): Promise<CoachTeam> {
        const result =
            await this.database.prisma.coachTeam.updateMany({
                where: {
                    id: squad.id,
                    tenantId: squad.tenantId,
                    coachUserId: squad.coachUserId,
                },
                data: CoachTeamMapper.toPersistence(squad),
            });

        if(result.count !== 1){
            throw new Error("Coach team was not found.");
        }

        const updated =
            await this.findById(
                squad.id,
                squad.tenantId,
                squad.coachUserId,
            );

        if(!updated){
            throw new Error("Coach team could not be reloaded.");
        }

        return updated;
    }
}
