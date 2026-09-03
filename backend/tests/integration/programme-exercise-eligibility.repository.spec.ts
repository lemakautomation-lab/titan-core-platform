import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeExerciseEligibilityCriteria } from "../../src/domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaExerciseRepository } from "../../src/infrastructure/repositories/exercise.repository";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function setup() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const sport = await testPrisma.sport.create({
        data: {
            tenantId: owner.tenant.id,
            name: `Eligibility ${randomUUID()}`,
            slug: `eligibility-${randomUUID()}`,
        },
    });
    const otherSport = await testPrisma.sport.create({
        data: {
            tenantId: other.tenant.id,
            name: `Other ${randomUUID()}`,
            slug: `other-${randomUUID()}`,
        },
    });
    const repository = new PrismaExerciseRepository(new DatabaseService());

    return { owner, other, sport, otherSport, repository };
}

function criteria(
    tenantId: string,
    overrides: {
        sportId?: string | null;
        goal?: ProgrammeGoalClassification;
        experience?: TrainingExperienceLevel;
        equipment?: string[];
    } = {},
) {
    return ProgrammeExerciseEligibilityCriteria.create(
        tenantId,
        ProgrammeGenerationGoal.create(
            overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        ),
        overrides.experience ?? TrainingExperienceLevel.INTERMEDIATE,
        overrides.sportId ?? null,
        overrides.equipment ?? ["barbell", "bench"],
    );
}

async function createExercise(
    tenantId: string,
    overrides: {
        id?: string;
        sportId?: string | null;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
        equipment?: string[];
        objective?: string;
        difficulty?: string;
    } = {},
) {
    return testPrisma.exercise.create({
        data: {
            id: overrides.id,
            tenantId,
            name: `Exercise ${randomUUID()}`,
            slug: `exercise-${randomUUID()}`,
            movement: "Push",
            muscleGroups: ["Chest"],
            equipment: overrides.equipment ?? ["Barbell"],
            trainingObjective: overrides.objective ?? "Strength",
            difficulty: overrides.difficulty ?? "Intermediate",
            sportId: overrides.sportId ?? null,
            status: overrides.status ?? "ACTIVE",
        },
    });
}

describe("Programme Exercise eligibility repository", () => {
    it("returns only same-tenant ACTIVE Exercises with combined predicates", async () => {
        const data = await setup();
        const eligible = await createExercise(data.owner.tenant.id, {
            sportId: data.sport.id,
        });
        const neutral = await createExercise(data.owner.tenant.id);
        await createExercise(data.owner.tenant.id, { status: "INACTIVE" });
        await createExercise(data.owner.tenant.id, { equipment: ["Rack"] });
        await createExercise(data.owner.tenant.id, { objective: "Speed" });
        await createExercise(data.owner.tenant.id, { difficulty: "Advanced" });
        await createExercise(data.other.tenant.id);

        const result = await data.repository.findEligibleForProgramme(
            criteria(data.owner.tenant.id, { sportId: data.sport.id }),
        );
        expect(result.map(item => item.id).sort()).toEqual(
            [eligible.id, neutral.id].sort(),
        );
    });

    it("applies absent-Sport and bodyweight semantics", async () => {
        const data = await setup();
        const bodyweight = await createExercise(data.owner.tenant.id, {
            equipment: [],
        });
        await createExercise(data.owner.tenant.id, {
            sportId: data.sport.id,
            equipment: [],
        });
        await createExercise(data.owner.tenant.id, {
            equipment: ["Barbell"],
        });

        const result = await data.repository.findEligibleForProgramme(
            criteria(data.owner.tenant.id, { equipment: [] }),
        );
        expect(result.map(item => item.id)).toEqual([bodyweight.id]);
    });

    it("fails safely for missing, inactive and cross-tenant Programme Sport", async () => {
        const data = await setup();
        const inactive = await testPrisma.sport.create({
            data: {
                tenantId: data.owner.tenant.id,
                name: `Inactive ${randomUUID()}`,
                slug: `inactive-${randomUUID()}`,
                status: "INACTIVE",
            },
        });

        for (const sportId of [randomUUID(), inactive.id, data.otherSport.id]) {
            await expect(data.repository.findEligibleForProgramme(
                criteria(data.owner.tenant.id, { sportId }),
            )).rejects.toThrow("Programme Sport is unavailable.");
        }
    });

    it("returns deterministic Exercise ID order before any bounded handling", async () => {
        const data = await setup();
        const ids = [randomUUID(), randomUUID(), randomUUID()].sort();
        for (const id of [...ids].reverse()) {
            await createExercise(data.owner.tenant.id, { id });
        }

        const input = criteria(data.owner.tenant.id);
        const first = await data.repository.findEligibleForProgramme(input);
        const second = await data.repository.findEligibleForProgramme(input);
        expect(first.map(item => item.id)).toEqual(ids);
        expect(second.map(item => item.id)).toEqual(ids);
    });

    it("returns an explicit empty set without relaxing constraints", async () => {
        const data = await setup();
        await createExercise(data.owner.tenant.id, {
            objective: "Core Stability",
            equipment: [],
        });

        expect(await data.repository.findEligibleForProgramme(
            criteria(data.owner.tenant.id, { equipment: [] }),
        )).toEqual([]);
    });

    it("rejects a cross-tenant Exercise/Sport direct write", async () => {
        const data = await setup();

        await expect(createExercise(data.owner.tenant.id, {
            sportId: data.otherSport.id,
        })).rejects.toBeDefined();
    });

    it("fails the migration preflight for inconsistent Exercise/Sport ownership", async () => {
        const tenantA = randomUUID();
        const tenantB = randomUUID();
        const sportId = randomUUID();
        const exerciseId = randomUUID();
        const migration = readFileSync(
            join(
                process.cwd(),
                "prisma",
                "migrations",
                "20260903000000_add_exercise_sport_tenant_integrity",
                "migration.sql",
            ),
            "utf8",
        );

        await expect(testPrisma.$transaction(async transaction => {
            await transaction.$executeRawUnsafe(
                'ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_sportId_tenantId_fkey"',
            );
            await transaction.$executeRawUnsafe(
                'ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE',
            );
            await transaction.$executeRaw`
                INSERT INTO "Tenant" ("id", "name", "slug", "updatedAt")
                VALUES
                    (${tenantA}, 'R3 preflight A', ${`r3-preflight-a-${tenantA}`}, NOW()),
                    (${tenantB}, 'R3 preflight B', ${`r3-preflight-b-${tenantB}`}, NOW())
            `;
            await transaction.$executeRaw`
                INSERT INTO "Sport" ("id", "tenantId", "name", "slug", "updatedAt")
                VALUES (${sportId}, ${tenantB}, 'R3 preflight Sport', ${`r3-preflight-sport-${sportId}`}, NOW())
            `;
            await transaction.$executeRaw`
                INSERT INTO "Exercise" (
                    "id", "tenantId", "name", "slug", "movement",
                    "muscleGroups", "equipment", "trainingObjective",
                    "difficulty", "sportId", "updatedAt"
                )
                VALUES (
                    ${exerciseId}, ${tenantA}, 'R3 preflight Exercise',
                    ${`r3-preflight-exercise-${exerciseId}`}, 'Push',
                    ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'Strength',
                    'Beginner', ${sportId}, NOW()
                )
            `;

            await transaction.$executeRawUnsafe(migration);
        })).rejects.toThrow(
            "Exercise tenant/Sport ownership preflight failed",
        );
    });
});
