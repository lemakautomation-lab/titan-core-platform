import { CoachTeam as PrismaCoachTeam } from "../../generated/prisma/client";
import { CoachTeam } from "../../domain/entities/coach-team.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class CoachTeamMapper {
    static toDomain(record: PrismaCoachTeam): CoachTeam {
        return new CoachTeam(
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

    static toPersistence(squad: CoachTeam) {
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
