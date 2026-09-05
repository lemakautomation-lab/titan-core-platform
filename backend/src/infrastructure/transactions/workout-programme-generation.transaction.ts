import { createHash, randomUUID } from "crypto";

import { Prisma } from "../../generated/prisma/client";
import {
    WorkoutProgrammeGenerationTransaction,
    WorkoutProgrammeGenerationTransactionInput,
    WorkoutProgrammeGenerationTransactionOutcome,
} from "../../application/ports/workout-programme-generation.transaction";
import { AuditLog, AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { WorkoutProgrammeGeneration } from "../../domain/entities/workout-programme-generation.entity";
import { WorkoutProgrammeExercisePrescription } from "../../domain/entities/workout-programme-exercise-prescription.entity";
import { WorkoutProgrammeSession } from "../../domain/entities/workout-programme-session.entity";
import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";
import { AuditAction } from "../../domain/security/audit-action";
import { AuditResource } from "../../domain/security/audit-resource";
import { ProgrammeExerciseEligibilityService } from "../../domain/services/programme-exercise-eligibility.service";
import { ProgrammeExercisePrescriptionReadinessService } from "../../domain/services/programme-exercise-prescription-readiness.service";
import { DeterministicProgrammeGenerationService } from "../../domain/services/deterministic-programme-generation.service";
import { ProgrammeExerciseEligibilityCriteria } from "../../domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeExercisePrescriptionCandidate } from "../../domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { ProgrammeGenerationFingerprintService } from "../../application/services/programme-generation-fingerprint.service";
import { DatabaseService } from "../database/database.service";
import { AthleteMapper } from "../mappers/athlete.mapper";
import { AuditLogMapper } from "../mappers/audit-log.mapper";
import { ExerciseMapper } from "../mappers/exercise.mapper";
import { ExercisePrescriptionProfileMapper } from "../mappers/exercise-prescription-profile.mapper";
import { WorkoutProgrammeGenerationMapper } from "../mappers/workout-programme-generation.mapper";
import { WorkoutProgrammeMapper } from "../mappers/workout-programme.mapper";
import { WorkoutProgrammeStructureMapper } from "../mappers/workout-programme-structure.mapper";

export class PrismaWorkoutProgrammeGenerationTransaction
implements WorkoutProgrammeGenerationTransaction {
    private static readonly LOCK_VERSION = "TITAN_R5_IDEMPOTENCY_LOCK_V1";

    constructor(private readonly database: DatabaseService) {}

    async execute(
        input: WorkoutProgrammeGenerationTransactionInput,
    ): Promise<WorkoutProgrammeGenerationTransactionOutcome> {
        this.validateInput(input);
        const advisoryKey = this.advisoryKey(
            input.tenantId,
            input.idempotencyKey,
        );

        try {
            return await this.database.prisma.$transaction(async tx => {
            await tx.$queryRaw`
                SELECT pg_advisory_xact_lock(${advisoryKey}::bigint)::text AS "lock"
            `;

            const existing = await tx.workoutProgrammeGeneration.findUnique({
                where: {
                    tenantId_idempotencyKey: {
                        tenantId: input.tenantId,
                        idempotencyKey: input.idempotencyKey,
                    },
                },
            });

            if (existing) {
                if (existing.requestFingerprint !== input.requestFingerprint) {
                    throw new Error("Idempotency key conflict.");
                }
                return this.loadOutcome(
                    tx,
                    existing.id,
                    input.tenantId,
                    "replayed",
                );
            }

            await this.requireActiveAuthority(tx, input);
            const criteria = ProgrammeExerciseEligibilityCriteria.create(
                input.tenantId,
                input.generationInput.goal,
                input.generationInput.trainingExperience,
                input.generationInput.sportId,
                input.generationInput.availableEquipment,
            );
            const candidates = await this.revalidateCandidates(tx, criteria);

            if (this.candidateSnapshot(candidates) !==
                this.candidateSnapshot(input.candidates)) {
                throw new Error("Generation candidates changed during transaction.");
            }

            const plan = DeterministicProgrammeGenerationService.generate(
                input.generationInput,
                candidates,
                input.ruleset,
            );
            const fingerprint = ProgrammeGenerationFingerprintService.plan(
                plan,
                input.ruleset,
            );
            if (fingerprint.fingerprint !== input.planFingerprint) {
                throw new Error("Generated Programme fingerprint changed.");
            }

            const programme = WorkoutProgramme.create(
                input.tenantId,
                plan.athleteId,
                plan.name,
                plan.description,
                plan.legacyGoal,
                plan.legacyExperience,
                plan.trainingFrequency,
                plan.sessionDurationMinutes,
                plan.sportId,
            );
            const structure = this.buildStructure(input.tenantId, programme.id, plan);
            const generation = WorkoutProgrammeGeneration.create({
                tenantId: input.tenantId,
                programmeId: programme.id,
                actorUserId: input.actorUserId,
                idempotencyKey: input.idempotencyKey,
                requestFingerprint: input.requestFingerprint,
                requestFingerprintVersion: input.requestFingerprintVersion,
                planFingerprint: input.planFingerprint,
                rulesetId: input.ruleset.id,
                rulesetVersion: input.ruleset.version,
                inputSnapshot: input.inputSnapshot,
                planSnapshot: input.planSnapshot,
            });

            await tx.workoutProgramme.create({
                data: WorkoutProgrammeMapper.toPersistence(programme),
            });
            await tx.workoutProgrammeGeneration.create({
                data: {
                    id: generation.id,
                    tenantId: generation.tenantId,
                    programmeId: generation.programmeId,
                    actorUserId: generation.actorUserId,
                    idempotencyKey: generation.idempotencyKey,
                    requestFingerprint: generation.requestFingerprint,
                    requestFingerprintVersion:
                        generation.requestFingerprintVersion,
                    planFingerprint: generation.planFingerprint,
                    rulesetId: generation.rulesetId,
                    rulesetVersion: generation.rulesetVersion,
                    inputSnapshot: generation.inputSnapshot as Prisma.InputJsonValue,
                    planSnapshot: generation.planSnapshot as Prisma.InputJsonValue,
                    createdAt: generation.createdAt,
                },
            });

            for (const session of structure.sessions) {
                await tx.workoutProgrammeSession.create({
                    data: {
                        id: session.id,
                        tenantId: session.tenantId,
                        programmeId: session.programmeId,
                        ordinal: session.ordinal,
                        name: session.name,
                        createdAt: session.createdAt,
                        updatedAt: session.updatedAt,
                    },
                });
                await tx.workoutProgrammeExercisePrescription.createMany({
                    data: session.prescriptions.map(prescription => ({
                        id: prescription.id,
                        tenantId: prescription.tenantId,
                        sessionId: prescription.sessionId,
                        exerciseId: prescription.exerciseId,
                        ordinal: prescription.ordinal,
                        sets: prescription.sets,
                        repetitions: prescription.repetitions,
                        durationSeconds: prescription.durationSeconds,
                        restSeconds: prescription.restSeconds,
                        createdAt: prescription.createdAt,
                        updatedAt: prescription.updatedAt,
                    })),
                });
            }

            const audit = AuditLog.create(
                input.tenantId,
                input.actorUserId,
                AuditAction.WORKOUT_PROGRAMME_GENERATED,
                AuditResource.WORKOUT_PROGRAMME,
                programme.id,
                AuditLogStatus.SUCCESS,
                {
                    generationId: generation.id,
                    requestFingerprint: generation.requestFingerprint,
                    planFingerprint: generation.planFingerprint,
                    rulesetId: generation.rulesetId,
                    rulesetVersion: generation.rulesetVersion,
                },
            );
            await tx.auditLog.create({ data: AuditLogMapper.toPersistence(audit) });

                return this.loadOutcome(
                    tx,
                    generation.id,
                    input.tenantId,
                    "created",
                );
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            if (!this.isRetryableTransactionConflict(error)) {
                throw error;
            }

            const existing = await this.database.prisma
                .workoutProgrammeGeneration.findUnique({
                    where: {
                        tenantId_idempotencyKey: {
                            tenantId: input.tenantId,
                            idempotencyKey: input.idempotencyKey,
                        },
                    },
                });
            if (!existing) {
                throw error;
            }
            if (existing.requestFingerprint !== input.requestFingerprint) {
                throw new Error("Idempotency key conflict.");
            }

            return this.loadOutcome(
                this.database.prisma,
                existing.id,
                input.tenantId,
                "replayed",
            );
        }
    }

    private async requireActiveAuthority(
        tx: Prisma.TransactionClient,
        input: WorkoutProgrammeGenerationTransactionInput,
    ): Promise<void> {
        const athletes = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "Athlete"
            WHERE "id" = ${input.generationInput.athleteId}
              AND "tenantId" = ${input.tenantId}
              AND "status" = 'ACTIVE'
            FOR UPDATE
        `;
        if (athletes.length !== 1) {
            throw new Error("Generation input is unavailable.");
        }

        if (input.generationInput.sportId !== null) {
            const sports = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id" FROM "Sport"
                WHERE "id" = ${input.generationInput.sportId}
                  AND "tenantId" = ${input.tenantId}
                  AND "status" = 'ACTIVE'
                FOR UPDATE
            `;
            if (sports.length !== 1) {
                throw new Error("Generation input is unavailable.");
            }
        }
    }

    private async revalidateCandidates(
        tx: Prisma.TransactionClient,
        criteria: ProgrammeExerciseEligibilityCriteria,
    ): Promise<readonly ProgrammeExercisePrescriptionCandidate[]> {
        const exerciseRows = await tx.exercise.findMany({
            where: {
                tenantId: criteria.tenantId,
                status: "ACTIVE",
                OR: criteria.sportId === null
                    ? [{ sportId: null }]
                    : [{ sportId: criteria.sportId }, { sportId: null }],
            },
            orderBy: { id: "asc" },
        });
        const eligible = ProgrammeExerciseEligibilityService.filter(
            criteria,
            exerciseRows.map(ExerciseMapper.toDomain),
        );
        if (eligible.length === 0) {
            return Object.freeze([]);
        }

        const exerciseIds = eligible.map(exercise => exercise.id);
        await tx.$queryRaw`
            SELECT "id" FROM "Exercise"
            WHERE "tenantId" = ${criteria.tenantId}
              AND "id" IN (${Prisma.join(exerciseIds)})
            ORDER BY "id" ASC
            FOR UPDATE
        `;

        const profileRows = await tx.exercisePrescriptionProfile.findMany({
            where: {
                tenantId: criteria.tenantId,
                exerciseId: { in: exerciseIds },
                goalClassification: criteria.goal.classification,
                trainingExperience: criteria.trainingExperience,
                status: "ACTIVE",
            },
            orderBy: [{ exerciseId: "asc" }, { id: "asc" }],
        });
        if (profileRows.length > 0) {
            await tx.$queryRaw`
                SELECT "id" FROM "ExercisePrescriptionProfile"
                WHERE "tenantId" = ${criteria.tenantId}
                  AND "id" IN (${Prisma.join(profileRows.map(row => row.id))})
                ORDER BY "exerciseId" ASC, "id" ASC
                FOR UPDATE
            `;
        }

        const lockedExerciseRows = await tx.exercise.findMany({
            where: { tenantId: criteria.tenantId, id: { in: exerciseIds } },
            orderBy: { id: "asc" },
        });
        const lockedEligible = ProgrammeExerciseEligibilityService.filter(
            criteria,
            lockedExerciseRows.map(ExerciseMapper.toDomain),
        );
        const lockedProfiles = await tx.exercisePrescriptionProfile.findMany({
            where: {
                tenantId: criteria.tenantId,
                exerciseId: { in: lockedEligible.map(item => item.id) },
                goalClassification: criteria.goal.classification,
                trainingExperience: criteria.trainingExperience,
                status: "ACTIVE",
            },
            orderBy: [{ exerciseId: "asc" }, { id: "asc" }],
        });

        return ProgrammeExercisePrescriptionReadinessService.createCandidates(
            criteria,
            lockedEligible,
            lockedProfiles.map(ExercisePrescriptionProfileMapper.toDomain),
        );
    }

    private buildStructure(
        tenantId: string,
        programmeId: string,
        plan: WorkoutProgrammeGenerationTransactionInput["plan"],
    ): WorkoutProgrammeStructure {
        const sessions = plan.sessions.map(sessionPlan => {
            const sessionId = randomUUID();
            const prescriptions = sessionPlan.prescriptions.map(item =>
                WorkoutProgrammeExercisePrescription.create(
                    tenantId,
                    sessionId,
                    item.exerciseId,
                    item.ordinal,
                    item.sets,
                    item.repetitions,
                    item.durationSeconds,
                    item.restSeconds,
                ),
            );
            return WorkoutProgrammeSession.restore(
                sessionId,
                tenantId,
                programmeId,
                sessionPlan.ordinal,
                sessionPlan.name,
                prescriptions,
                new Date(),
                new Date(),
            );
        });
        return WorkoutProgrammeStructure.create(tenantId, programmeId, sessions);
    }

    private async loadOutcome(
        tx: Pick<
            Prisma.TransactionClient,
            "workoutProgrammeGeneration" | "workoutProgramme"
        >,
        generationId: string,
        tenantId: string,
        status: "created" | "replayed",
    ): Promise<WorkoutProgrammeGenerationTransactionOutcome> {
        const generation = await tx.workoutProgrammeGeneration.findUnique({
            where: { id: generationId, tenantId },
        });
        if (!generation || generation.tenantId !== tenantId) {
            throw new Error("Generated Programme invariant failure.");
        }
        const programme = await tx.workoutProgramme.findFirst({
            where: { id: generation.programmeId, tenantId: generation.tenantId },
            include: {
                sessions: {
                    orderBy: { ordinal: "asc" },
                    include: { prescriptions: { orderBy: { ordinal: "asc" } } },
                },
            },
        });
        if (!programme || programme.sessions.length === 0 ||
            programme.sessions.some(session => session.prescriptions.length === 0)) {
            throw new Error("Generated Programme invariant failure.");
        }

        return Object.freeze({
            status,
            programme: WorkoutProgrammeMapper.toDomain(programme),
            structure: WorkoutProgrammeStructureMapper.toDomain(
                programme.tenantId,
                programme.id,
                programme.sessions,
            ),
            generation: WorkoutProgrammeGenerationMapper.toDomain(generation),
        });
    }

    private candidateSnapshot(
        candidates: readonly ProgrammeExercisePrescriptionCandidate[],
    ): string {
        return JSON.stringify(candidates.map(candidate => ({
            exerciseId: candidate.exerciseId,
            profileId: candidate.profileId,
            profileVersion: candidate.profileVersion,
            goalClassification: candidate.goalClassification,
            trainingExperience: candidate.trainingExperience,
            prescriptionMode: candidate.prescriptionMode,
            sets: candidate.sets,
            repetitions: candidate.repetitions,
            durationSeconds: candidate.durationSeconds,
            restSeconds: candidate.restSeconds,
            estimatedSetDurationSeconds: candidate.estimatedSetDurationSeconds,
            approximatePrescriptionSeconds:
                candidate.approximatePrescriptionSeconds,
        })));
    }

    private advisoryKey(tenantId: string, idempotencyKey: string): bigint {
        const digest = createHash("sha256")
            .update(`${PrismaWorkoutProgrammeGenerationTransaction.LOCK_VERSION}\u0000${tenantId}\u0000${idempotencyKey}`, "utf8")
            .digest();
        return digest.readBigInt64BE(0);
    }

    private validateInput(input: WorkoutProgrammeGenerationTransactionInput): void {
        if (!input || !Object.isFrozen(input) || !Object.isFrozen(input.candidates)) {
            throw new Error("Generation transaction input must be immutable.");
        }
    }

    private isRetryableTransactionConflict(error: unknown): boolean {
        return error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034";
    }
}
