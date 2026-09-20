import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";

export class ListCoachSquadAthletesUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(input: {
        tenantId: string;
        userId: string;
        squadId: string;
    }): Promise<Result<Array<{
        athleteId: string;
        firstName: string;
        lastName: string;
        countryCode: string | null;
        status: string;
    }>>> {
        const squad =
            await this.squadRepository.findById(
                input.squadId,
                input.tenantId,
                input.userId,
            );

        if (!squad) {
            return Result.failure("Coach squad not found.");
        }

        const memberships =
            await this.membershipRepository.listForSquad(
                input.tenantId,
                input.squadId,
            );

        const athletes = [];

        for (const membership of memberships) {
            const athlete =
                await this.athleteRepository.findById(
                    membership.athleteId,
                    input.tenantId,
                );

            if (!athlete) {
                continue;
            }

            athletes.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                countryCode: athlete.countryCode,
                status: String(athlete.status),
            });
        }

        return Result.success(athletes);
    }
}
