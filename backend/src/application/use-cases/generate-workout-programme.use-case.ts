import { GenerateWorkoutProgrammeRequest } from "../commands/generate-workout-programme-request";
import { WorkoutProgrammeGenerationTransaction } from "../ports/workout-programme-generation.transaction";
import { ProgrammeGenerationFingerprintService } from "../services/programme-generation-fingerprint.service";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { ProgrammeExercisePrescriptionCandidateRepository } from "../../domain/repositories/programme-exercise-prescription-candidate.repository";
import { SportRepository } from "../../domain/repositories/sport.repository";
import { DeterministicProgrammeGenerationService } from "../../domain/services/deterministic-programme-generation.service";
import { ProgrammeExerciseEligibilityCriteria } from "../../domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeGenerationRuleset } from "../../domain/value-objects/programme-generation-ruleset.value-object";

export class GenerateWorkoutProgrammeUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly sportRepository: SportRepository,
        private readonly candidateRepository:
            ProgrammeExercisePrescriptionCandidateRepository,
        private readonly transaction: WorkoutProgrammeGenerationTransaction,
    ) {}

    async execute(request: GenerateWorkoutProgrammeRequest) {
        if (!(request instanceof GenerateWorkoutProgrammeRequest)) {
            throw new Error("Programme generation request is required.");
        }

        const { command } = request;
        const { input } = command;
        const athlete = await this.athleteRepository.findById(
            input.athleteId,
            command.tenantId,
        );
        if (!athlete || !athlete.isActive()) {
            throw new Error("Generation input is unavailable.");
        }

        if (input.sportId !== null) {
            const sport = await this.sportRepository.findById(
                input.sportId,
                command.tenantId,
            );
            if (!sport || !sport.isActive()) {
                throw new Error("Generation input is unavailable.");
            }
        }

        const criteria = ProgrammeExerciseEligibilityCriteria.create(
            command.tenantId,
            input.goal,
            input.trainingExperience,
            input.sportId,
            input.availableEquipment,
        );

        let candidates;
        try {
            candidates = await this.candidateRepository.findReadyForProgramme(
                criteria,
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "Programme Sport is unavailable."
            ) {
                throw new Error("Generation input is unavailable.");
            }
            throw error;
        }

        const ruleset = ProgrammeGenerationRuleset.v1();
        const plan = DeterministicProgrammeGenerationService.generate(
            input,
            candidates,
            ruleset,
        );
        const requestFingerprint = ProgrammeGenerationFingerprintService.request(
            command,
            ruleset,
        );
        const planFingerprint = ProgrammeGenerationFingerprintService.plan(
            plan,
            ruleset,
        );

        return this.transaction.execute(Object.freeze({
            tenantId: command.tenantId,
            actorUserId: command.actorUserId,
            idempotencyKey: request.idempotencyKey,
            generationInput: input,
            candidates: Object.freeze([...candidates]),
            plan,
            ruleset,
            requestFingerprint: requestFingerprint.fingerprint,
            requestFingerprintVersion: requestFingerprint.fingerprintVersion,
            planFingerprint: planFingerprint.fingerprint,
            inputSnapshot: requestFingerprint.snapshot,
            planSnapshot: planFingerprint.snapshot,
        }));
    }
}
