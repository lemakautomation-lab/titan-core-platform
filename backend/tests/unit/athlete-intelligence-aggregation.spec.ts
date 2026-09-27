import { describe, expect, it, vi } from "vitest";
import { ReadAthleteIntelligenceAggregate } from "../../src/application/intelligence/athlete-aggregation";

const tenantId = "tenant-1";
const actorId = "actor-1";
const athleteId = "athlete-1";

function fixture(allowed: boolean) {
    const context = { read: vi.fn(async () => allowed ? { athleteId, organisationId: null } : null) };
    const training = { execute: vi.fn(async () => ({ athleteId, programmes: [] as [] })) };
    const nutrition = { execute: vi.fn(async () => null) };
    const recovery = { execute: vi.fn(async () => null) };
    const wearables = { execute: vi.fn(async () => null) };
    const performanceTests = { execute: vi.fn(async () => null) };
    const goals = { execute: vi.fn(async () => null) };
    const sportRequirements = { execute: vi.fn(async () => null) };
    const readers = [training, nutrition, recovery, wearables, performanceTests, goals, sportRequirements];
    const aggregate = new ReadAthleteIntelligenceAggregate(context, training, nutrition, recovery,
        wearables, performanceTests, goals, sportRequirements);
    return { context, readers, aggregate, training };
}

describe("Mission 071.9 authorised data aggregation", () => {
    it("does not invoke any source when the Athlete identity boundary denies access", async () => {
        const { aggregate, context, readers } = fixture(false);
        expect(await aggregate.execute(tenantId, actorId, athleteId)).toBeNull();
        expect(context.read).toHaveBeenCalledWith(tenantId, actorId, athleteId);
        for (const reader of readers) expect(reader.execute).not.toHaveBeenCalled();
    });

    it("retains independently denied sources as null and an authorised empty source as data", async () => {
        const { aggregate, readers } = fixture(true);
        const result = await aggregate.execute(tenantId, actorId, athleteId);
        expect(result).toEqual({ athleteId, training: { athleteId, programmes: [] }, nutrition: null,
            recovery: null, wearables: null, performanceTests: null, goals: null, sportRequirements: null });
        for (const reader of readers) expect(reader.execute).toHaveBeenCalledWith(tenantId, actorId, athleteId);
    });

    it("fails the entire read when a source fails instead of returning partial intelligence", async () => {
        const { aggregate, training } = fixture(true);
        training.execute.mockRejectedValueOnce(new Error("source unavailable"));
        await expect(aggregate.execute(tenantId, actorId, athleteId))
            .rejects.toThrow("source unavailable");
    });
});
