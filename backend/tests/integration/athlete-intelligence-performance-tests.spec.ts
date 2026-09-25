import { describe, expect, it } from "vitest";
import { ManageAthletePerformanceTests } from "../../src/application/intelligence/manage-athlete-performance-tests";
import { ReadAthleteIntelligencePerformanceTests } from "../../src/application/intelligence/athlete-performance-tests";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthletePerformanceTestsReader } from "../../src/infrastructure/queries/athlete-intelligence-performance-tests.query";
import { PrismaAthletePerformanceTestWriter } from "../../src/infrastructure/queries/athlete-performance-test.writer";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const context = new PrismaAthleteIntelligenceContextReader(database);
const permissions = authorizationModule.authorizationService;
const manage = new ManageAthletePerformanceTests(context, permissions,
    new PrismaAthletePerformanceTestWriter(database));
const read = new ReadAthleteIntelligencePerformanceTests(context, permissions,
    new PrismaAthletePerformanceTestsReader(database));

describe("Mission 071.6 governed performance tests", () => {
    it("requires independent grants and an active Athlete relationship in one tenant", async () => {
        const owner = await createTestUser({ permissions: ["performance-tests.write"] });
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["performance-tests.read"] });
        const foreign = await createTestUser({ permissions: ["performance-tests.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Test", lastName: "Scope",
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId: owner.tenant.id, name: "Track", slug: "track",
        } });
        const protocolInput = { tenantId: owner.tenant.id, actorId: owner.user.id,
            sportId: sport.id, code: "SPRINT_100M", name: "100 m sprint", unit: "s",
        };
        expect(await manage.registerProtocol({ ...protocolInput, actorId: professional.user.id })).toBeNull();
        const protocol = await manage.registerProtocol(protocolInput);
        expect(protocol?.version).toBe(1);
        expect(await read.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await read.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
        expect(await read.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect(await read.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, results: [] });
        expect(await manage.recordResult({ tenantId: owner.tenant.id,
            actorId: professional.user.id, athleteId: athlete.id, protocolId: protocol!.id,
            value: "12.25", recordedAt: new Date("2025-01-01"),
        })).toBeNull();
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { status: "INACTIVE" },
        });
        expect(await read.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("versions protocols, preserves corrected results and excludes superseded values", async () => {
        const owner = await createTestUser({ permissions: ["performance-tests.write", "performance-tests.read"] });
        const foreign = await createTestUser();
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Own", lastName: "Test",
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId: owner.tenant.id, name: "Swimming", slug: "swimming",
        } });
        const foreignSport = await testPrisma.sport.create({ data: {
            tenantId: foreign.tenant.id, name: "Other", slug: "other",
        } });
        const p = { tenantId: owner.tenant.id, actorId: owner.user.id,
            sportId: sport.id, code: "TIME_50M", name: "50 m time", unit: "s",
        };
        await expect(manage.registerProtocol({ ...p, sportId: foreignSport.id })).rejects.toThrow();
        await expect(manage.registerProtocol({ ...p, code: "invalid" })).rejects.toThrow();
        const protocol = await manage.registerProtocol(p);
        const at = new Date("2025-01-01T12:00:00.000Z");
        const input = { tenantId: owner.tenant.id, actorId: owner.user.id,
            athleteId: athlete.id, protocolId: protocol!.id, value: "30.123456", recordedAt: at,
        };
        await expect(manage.recordResult({ ...input, value: "-1" })).rejects.toThrow();
        const first = await manage.recordResult(input);
        const corrected = await manage.recordResult({ ...input, value: "29.123456",
            correctsResultId: first!.id,
        });
        await expect(manage.recordResult({ ...input, correctsResultId: first!.id })).rejects.toThrow();
        const next = await manage.registerProtocol({ ...p, unit: "seconds" });
        expect(next?.version).toBe(2);
        expect((await read.execute(owner.tenant.id, owner.user.id, athlete.id))?.results)
            .toEqual([{ id: corrected!.id, protocolId: protocol!.id, sportId: sport.id,
                protocolCode: "TIME_50M", protocolName: "50 m time", protocolVersion: 1,
                unit: "s", value: "29.123456", recordedAt: at, correctsResultId: first!.id,
            }]);
        expect(await testPrisma.auditLog.count({ where: { tenantId: owner.tenant.id,
            action: "PERFORMANCE_TEST_RESULT_CORRECT",
        } })).toBe(1);
    });
});
