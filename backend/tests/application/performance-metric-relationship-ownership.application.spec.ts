import { describe, expect, it, vi } from "vitest";

import { CreatePerformanceMetricUseCase } from "../../src/application/use-cases/create-performance-metric.use-case";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../src/domain/repositories/performance-metric.repository";
import { SportRepository } from "../../src/domain/repositories/sport.repository";
import { NotFoundException } from "../../src/shared/exceptions/not-found.exception";

const tenantId = "tenant-1";
const athleteId = "athlete-1";
const sportId = "sport-1";

function createCommand() {
    return {
        tenantId,
        athleteId,
        sportId,
        name: "Sprint Speed",
        slug: "sprint-speed",
        unit: "m/s",
        dataType: "NUMBER",
    };
}

function createMetricRepository() {
    return {
        create: vi.fn(async (metric) => metric),
    } as unknown as PerformanceMetricRepository;
}

function createAthleteRepository(found = true) {
    return {
        findById: vi.fn(async () =>
            found
                ? { id: athleteId, tenantId } as never
                : null,
        ),
    } as unknown as AthleteRepository;
}

function createSportRepository(found = true) {
    return {
        findById: vi.fn(async () =>
            found
                ? { id: sportId, tenantId } as never
                : null,
        ),
    } as unknown as SportRepository;
}

describe("Performance Metric relationship ownership", () => {
    it("validates Athlete before Sport and preserves trusted relationships", async () => {
        const metricRepository = createMetricRepository();
        const athleteRepository = createAthleteRepository();
        const sportRepository = createSportRepository();
        const useCase = new CreatePerformanceMetricUseCase(
            metricRepository,
            athleteRepository,
            sportRepository,
        );

        const metric = await useCase.execute(createCommand());

        expect(athleteRepository.findById).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );
        expect(sportRepository.findById).toHaveBeenCalledWith(
            sportId,
            tenantId,
        );
        expect(
            vi.mocked(athleteRepository.findById).mock.invocationCallOrder[0],
        ).toBeLessThan(
            vi.mocked(sportRepository.findById).mock.invocationCallOrder[0],
        );
        expect(metric.tenantId).toBe(tenantId);
        expect(metric.athleteId).toBe(athleteId);
        expect(metric.sportId).toBe(sportId);
        expect(metricRepository.create).toHaveBeenCalledTimes(1);
    });

    it("stops after a scoped Athlete miss", async () => {
        const metricRepository = createMetricRepository();
        const athleteRepository = createAthleteRepository(false);
        const sportRepository = createSportRepository();
        const useCase = new CreatePerformanceMetricUseCase(
            metricRepository,
            athleteRepository,
            sportRepository,
        );

        await expect(useCase.execute(createCommand()))
            .rejects.toEqual(
                expect.objectContaining<Partial<NotFoundException>>({
                    message: "Athlete not found.",
                    statusCode: 404,
                }),
            );

        expect(athleteRepository.findById).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );
        expect(sportRepository.findById).not.toHaveBeenCalled();
        expect(metricRepository.create).not.toHaveBeenCalled();
    });

    it("stops after a scoped Sport miss", async () => {
        const metricRepository = createMetricRepository();
        const athleteRepository = createAthleteRepository();
        const sportRepository = createSportRepository(false);
        const useCase = new CreatePerformanceMetricUseCase(
            metricRepository,
            athleteRepository,
            sportRepository,
        );

        await expect(useCase.execute(createCommand()))
            .rejects.toEqual(
                expect.objectContaining<Partial<NotFoundException>>({
                    message: "Sport not found.",
                    statusCode: 404,
                }),
            );

        expect(athleteRepository.findById).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );
        expect(sportRepository.findById).toHaveBeenCalledWith(
            sportId,
            tenantId,
        );
        expect(metricRepository.create).not.toHaveBeenCalled();
    });
});
