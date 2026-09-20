import { CoachSquad } from "../../domain/entities/coach-squad.entity";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { DatabaseService } from "../database/database.service";
import { CoachSquadMapper } from "../mappers/coach-squad.mapper";

export class PrismaCoachSquadRepository
implements CoachSquadRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachSquad | null> {
        const record =
            await this.database.prisma.coachSquad.findFirst({
                where: {
                    id,
                    tenantId,
                    coachUserId,
                },
            });

        return record
            ? CoachSquadMapper.toDomain(record)
            : null;
    }

    async listForCoach(
        tenantId: string,
        coachUserId: string,
    ): Promise<CoachSquad[]> {
        const records =
            await this.database.prisma.coachSquad.findMany({
                where: {
                    tenantId,
                    coachUserId,
                },
                orderBy: [
                    { name: "asc" },
                    { id: "asc" },
                ],
            });

        return records.map(CoachSquadMapper.toDomain);
    }

    async create(
        squad: CoachSquad,
    ): Promise<CoachSquad> {
        const created =
            await this.database.prisma.coachSquad.create({
                data: CoachSquadMapper.toPersistence(squad),
            });

        return CoachSquadMapper.toDomain(created);
    }

    async update(
        squad: CoachSquad,
    ): Promise<CoachSquad> {
        const result =
            await this.database.prisma.coachSquad.updateMany({
                where: {
                    id: squad.id,
                    tenantId: squad.tenantId,
                    coachUserId: squad.coachUserId,
                },
                data: CoachSquadMapper.toPersistence(squad),
            });

        if(result.count !== 1){
            throw new Error("Coach squad was not found.");
        }

        const updated =
            await this.findById(
                squad.id,
                squad.tenantId,
                squad.coachUserId,
            );

        if(!updated){
            throw new Error("Coach squad could not be reloaded.");
        }

        return updated;
    }
}
