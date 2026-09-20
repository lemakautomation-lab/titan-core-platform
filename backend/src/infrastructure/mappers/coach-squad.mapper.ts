import { CoachSquad as PrismaCoachSquad } from "../../generated/prisma/client";
import { CoachSquad } from "../../domain/entities/coach-squad.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class CoachSquadMapper {
    static toDomain(record: PrismaCoachSquad): CoachSquad {
        return new CoachSquad(
            record.id,
            record.tenantId,
            record.coachUserId,
            record.name,
            record.description,
            record.status as RecordStatus,
            record.createdAt,
            record.updatedAt,
        );
    }

    static toPersistence(squad: CoachSquad) {
        return {
            id: squad.id,
            tenantId: squad.tenantId,
            coachUserId: squad.coachUserId,
            name: squad.name,
            description: squad.description,
            status: squad.status,
            createdAt: squad.createdAt,
            updatedAt: squad.updatedAt,
        };
    }
}
