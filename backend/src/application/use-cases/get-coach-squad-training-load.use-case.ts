import { Result } from "../common/result";

import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetCoachSquadTrainingLoadUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly trainingStressRepository: TrainingStressRepository,
    ) {}

    async execute(input: {
        tenantId: string;
        userId: string;
        squadId: string;
        limit: number;
    }): Promise<Result<{
        squadId: string;
        squadName: string;
        memberCount: number;
        athletes: Array<{
            athleteId: string;
            firstName: string;
            lastName: string;
            observationCount: number;
            observations: Array<{
                id: string;
                value: number;
                recordedAt: string;
            }>;
        }>;
    }>> {
        if (
            !Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100
        ) {
            return Result.failure(
                "Training load limit must be an integer between 1 and 100.",
            );
        }

        const squad = await this.squadRepository.findById(
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

        const athletes: Array<{
            athleteId: string;
            firstName: string;
            lastName: string;
            observationCount: number;
            observations: Array<{
                id: string;
                value: number;
                recordedAt: string;
            }>;
        }> = [];

        for (const membership of memberships) {
            const athlete = await this.athleteRepository.findById(
                membership.athleteId,
                input.tenantId,
            );

            if (!athlete) {
                continue;
            }

            const relationship =
                await this.relationshipRepository.findByAthleteAndRelatedEntity(
                    athlete.id,
                    input.userId,
                    AthleteRelationshipType.COACH,
                    input.tenantId,
                );

            if (!relationship || !relationship.isActive()) {
                continue;
            }

            const stress =
                await this.trainingStressRepository.listRecentForAthlete(
                    input.tenantId,
                    athlete.id,
                    input.limit,
                );

            const observations = stress
                .map(item => ({
                    id: item.id,
                    value: item.value,
                    recordedAt: item.recordedAt.toISOString(),
                }))
                .sort((a, b) =>
                    a.recordedAt.localeCompare(b.recordedAt) ||
                    a.id.localeCompare(b.id),
                );

            athletes.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                observationCount: observations.length,
                observations,
            });
        }

        athletes.sort((a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName) ||
            a.athleteId.localeCompare(b.athleteId),
        );

        return Result.success({
            squadId: squad.id,
            squadName: squad.name,
            memberCount: athletes.length,
            athletes,
        });
    }
}
