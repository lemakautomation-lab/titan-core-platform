import { createHash } from "crypto";

import { Prisma } from "../../generated/prisma/client";
import {
    NutritionPlanGenerationTransaction,
    NutritionPlanGenerationTransactionInput,
    NutritionPlanGenerationTransactionOutcome,
} from "../../application/ports/nutrition-plan-generation.transaction";
import { AuditLog, AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { AuditAction } from "../../domain/security/audit-action";
import { AuditResource } from "../../domain/security/audit-resource";
import { DatabaseService } from "../database/database.service";
import { AuditLogMapper } from "../mappers/audit-log.mapper";
import { NutritionPlanMapper } from "../mappers/nutrition-plan.mapper";

export class PrismaNutritionPlanGenerationTransaction
implements NutritionPlanGenerationTransaction {
    private static readonly LOCK_VERSION =
        "TITAN_R5_NUTRITION_IDEMPOTENCY_LOCK_V1";

    constructor(private readonly database: DatabaseService) {}

    async execute(
        input: NutritionPlanGenerationTransactionInput,
    ): Promise<NutritionPlanGenerationTransactionOutcome> {
        this.validateInput(input);

        const advisoryKey = this.advisoryKey(
            input.tenantId,
            input.idempotencyKey,
        );

        try {
            return await this.database.prisma.$transaction(
                async tx => {
                    await tx.$queryRaw`
                        SELECT pg_advisory_xact_lock(
                            ${advisoryKey}::bigint
                        )::text AS "lock"
                    `;

                    const existing =
                        await tx.nutritionPlan.findUnique({
                            where: {
                                tenantId_idempotencyKey: {
                                    tenantId: input.tenantId,
                                    idempotencyKey:
                                        input.idempotencyKey,
                                },
                            },
                        });

                    if (existing) {
                        if (
                            existing.requestFingerprint !==
                            input.requestFingerprint
                        ) {
                            throw new Error(
                                "Idempotency key conflict.",
                            );
                        }

                        return {
                            status: "replayed",
                            plan: NutritionPlanMapper.toDomain(existing),
                        };
                    }

                    await this.requireActiveAuthority(tx, input);

                    await tx.nutritionPlan.create({
                        data: NutritionPlanMapper.toPersistence(
                            input.plan,
                        ),
                    });

                    const audit = AuditLog.create(
                        input.tenantId,
                        input.actorUserId,
                        AuditAction.NUTRITION_PLAN_GENERATED,
                        AuditResource.NUTRITION_PLAN,
                        input.plan.id,
                        AuditLogStatus.SUCCESS,
                        {
                            requestFingerprint:
                                input.requestFingerprint,
                            requestFingerprintVersion:
                                input.requestFingerprintVersion,
                            generatorId:
                                input.plan.generatorId,
                            generatorVersion:
                                input.plan.generatorVersion,
                        },
                    );

                    await tx.auditLog.create({
                        data: AuditLogMapper.toPersistence(audit),
                    });

                    const created =
                        await tx.nutritionPlan.findUnique({
                            where: {
                                id: input.plan.id,
                                tenantId: input.tenantId,
                            },
                        });

                    if (!created) {
                        throw new Error(
                            "Generated nutrition plan invariant failure.",
                        );
                    }

                    return {
                        status: "created",
                        plan: NutritionPlanMapper.toDomain(created),
                    };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error) {
            if (!this.isRetryableTransactionConflict(error)) {
                throw error;
            }

            const existing =
                await this.database.prisma.nutritionPlan.findUnique({
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

            if (
                existing.requestFingerprint !==
                input.requestFingerprint
            ) {
                throw new Error("Idempotency key conflict.");
            }

            return {
                status: "replayed",
                plan: NutritionPlanMapper.toDomain(existing),
            };
        }
    }

    private async requireActiveAuthority(
        tx: Prisma.TransactionClient,
        input: NutritionPlanGenerationTransactionInput,
    ): Promise<void> {
        const athletes =
            await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id"
                FROM "Athlete"
                WHERE "id" = ${input.plan.athleteId}
                  AND "tenantId" = ${input.tenantId}
                  AND "status" = 'ACTIVE'
                FOR UPDATE
            `;

        if (athletes.length !== 1) {
            throw new Error(
                "Nutrition generation input is unavailable.",
            );
        }
    }

    private advisoryKey(
        tenantId: string,
        idempotencyKey: string,
    ): bigint {
        const digest = createHash("sha256")
            .update(
                `${PrismaNutritionPlanGenerationTransaction.LOCK_VERSION}\u0000${tenantId}\u0000${idempotencyKey}`,
                "utf8",
            )
            .digest();

        return digest.readBigInt64BE(0);
    }

    private validateInput(
        input: NutritionPlanGenerationTransactionInput,
    ): void {
        if (!input || !Object.isFrozen(input)) {
            throw new Error(
                "Nutrition generation transaction input must be immutable.",
            );
        }

        if (input.tenantId !== input.plan.tenantId) {
            throw new Error("Nutrition plan tenant mismatch.");
        }

        if (input.idempotencyKey !== input.plan.idempotencyKey) {
            throw new Error(
                "Nutrition plan idempotency key mismatch.",
            );
        }

        if (
            input.requestFingerprint !==
            input.plan.requestFingerprint
        ) {
            throw new Error(
                "Nutrition plan fingerprint mismatch.",
            );
        }

        if (
            input.requestFingerprintVersion !==
            input.plan.requestFingerprintVersion
        ) {
            throw new Error(
                "Nutrition plan fingerprint version mismatch.",
            );
        }
    }

    private isRetryableTransactionConflict(
        error: unknown,
    ): boolean {
        return (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
        );
    }
}

