import { describe, expect, it } from "vitest";

import { CreatePerformanceMetricUseCase } from "../../src/application/use-cases/create-performance-metric.use-case";
import { UpdatePerformanceMetricUseCase } from "../../src/application/use-cases/update-performance-metric.use-case";
import { PerformanceMetric } from "../../src/domain/entities/performance-metric.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { PerformanceMetricRepository } from "../../src/domain/repositories/performance-metric.repository";
import { ValidationException } from "../../src/shared/exceptions/validation.exception";

const tenantId = "tenant-1";
const metricId = "metric-1";

function createRepository(
    existing?: PerformanceMetric,
): PerformanceMetricRepository {
    let metric = existing ?? null;

    return {
        findById: async (id, requestedTenantId) =>
            id === metric?.id && requestedTenantId === metric.tenantId
                ? metric
                : null,
        create: async (created) => {
            metric = created;
            return created;
        },
        update: async (updated) => {
            metric = updated;
            return updated;
        },
    } as unknown as PerformanceMetricRepository;
}

function existingMetric(): PerformanceMetric {
    return PerformanceMetric.create({
        id: metricId,
        tenantId,
        athleteId: "athlete-1",
        sportId: "sport-1",
        name: "Sprint Speed",
        slug: "sprint-speed",
        description: "Maximum sprint speed",
        unit: "m/s",
        dataType: "NUMBER",
        status: RecordStatus.ACTIVE,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
}

function createCommand(dataType: string) {
    return {
        tenantId,
        athleteId: "athlete-1",
        sportId: "sport-1",
        name: "Sprint Speed",
        slug: "sprint-speed",
        description: " Maximum sprint speed ",
        unit: " m/s ",
        dataType,
    };
}

describe("Performance Metric numeric semantics", () => {
    for (const dataType of ["NUMBER", "DECIMAL", "INTEGER"]) {
        it(`accepts ${dataType}`, async () => {
            const useCase = new CreatePerformanceMetricUseCase(
                createRepository(),
            );

            const metric = await useCase.execute(createCommand(dataType));

            expect(metric.dataType).toBe(dataType);
            expect(metric.unit).toBe("m/s");
            expect(metric.description).toBe("Maximum sprint speed");
        });
    }

    for (const dataType of ["TEXT", "BOOLEAN", "   "]) {
        it(`rejects unsupported dataType ${JSON.stringify(dataType)}`, async () => {
            const useCase = new CreatePerformanceMetricUseCase(
                createRepository(),
            );

            await expect(
                useCase.execute(createCommand(dataType)),
            ).rejects.toBeInstanceOf(ValidationException);
        });
    }
});

describe("Performance Metric historical immutability", () => {
    it("rejects an actual unit mutation", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        await expect(
            useCase.execute({ id: metricId, tenantId, unit: "km/h" }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it("rejects an actual dataType mutation", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        await expect(
            useCase.execute({ id: metricId, tenantId, dataType: "INTEGER" }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it("accepts an identical normalized unit", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        const result = await useCase.execute({
            id: metricId,
            tenantId,
            unit: " m/s ",
        });

        expect(result.unit).toBe("m/s");
    });

    it("accepts an identical normalized dataType", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        const result = await useCase.execute({
            id: metricId,
            tenantId,
            dataType: " number ",
        });

        expect(result.dataType).toBe("NUMBER");
    });

    it("keeps name mutable", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        const result = await useCase.execute({
            id: metricId,
            tenantId,
            name: " Top Speed ",
        });

        expect(result.name).toBe("Top Speed");
    });

    it("keeps slug mutable", async () => {
        const useCase = new UpdatePerformanceMetricUseCase(
            createRepository(existingMetric()),
        );

        const result = await useCase.execute({
            id: metricId,
            tenantId,
            slug: " Top-Speed ",
        });

        expect(result.slug).toBe("top-speed");
    });

    it("keeps description mutable and normalizes blank text", async () => {
        const repository = createRepository(existingMetric());
        const useCase = new UpdatePerformanceMetricUseCase(repository);

        const updated = await useCase.execute({
            id: metricId,
            tenantId,
            description: " Updated maximum speed ",
        });

        expect(updated.description).toBe("Updated maximum speed");

        const cleared = await useCase.execute({
            id: metricId,
            tenantId,
            description: "   ",
        });

        expect(cleared.description).toBeNull();
    });
});
