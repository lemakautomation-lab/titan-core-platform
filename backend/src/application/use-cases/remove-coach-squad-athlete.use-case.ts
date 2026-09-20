import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";

export class RemoveCoachSquadAthleteUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
    ) {}

    async execute(input: {
        tenantId: string;
        userId: string;
        squadId: string;
        athleteId: string;
    }): Promise<Result<void>> {
        const squad =
            await this.squadRepository.findById(
                input.squadId,
                input.tenantId,
                input.userId,
            );

        if (!squad) {
            return Result.failure("Coach squad not found.");
        }

        const removed =
            await this.membershipRepository.remove(
                input.tenantId,
                input.squadId,
                input.athleteId,
            );

        if (!removed) {
            return Result.failure(
                "Squad athlete membership not found.",
            );
        }

        return Result.success(undefined);
    }
}
