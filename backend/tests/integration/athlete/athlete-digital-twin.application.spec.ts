import { describe, expect, it, vi, beforeEach } from "vitest";

import { AthleteDigitalTwin } from "../../../src/domain/entities/athlete-digital-twin.entity";
import { RecordStatus } from "../../../src/domain/enums/record-status.enum";

import { CreateAthleteDigitalTwinUseCase } from "../../../src/application/use-cases/create-athlete-digital-twin.use-case";
import { GetAthleteDigitalTwinByIdUseCase } from "../../../src/application/use-cases/get-athlete-digital-twin-by-id.use-case";
import { GetAthleteDigitalTwinByAthleteIdUseCase } from "../../../src/application/use-cases/get-athlete-digital-twin-by-athlete-id.use-case";
import { UpdateAthleteDigitalTwinLifecycleUseCase } from "../../../src/application/use-cases/update-athlete-digital-twin-lifecycle.use-case";

import { CreateAthleteDigitalTwinCommand } from "../../../src/application/commands/create-athlete-digital-twin.command";
import { GetAthleteDigitalTwinByIdQuery } from "../../../src/application/queries/athlete-digital-twin/get-athlete-digital-twin-by-id.query";
import { GetAthleteDigitalTwinByAthleteIdQuery } from "../../../src/application/queries/athlete-digital-twin/get-athlete-digital-twin-by-athlete-id.query";
import { UpdateAthleteDigitalTwinLifecycleCommand } from "../../../src/application/commands/update-athlete-digital-twin-lifecycle.command";

describe("Athlete Digital Twin application layer", () => {

    const tenantId = "tenant-1";
    const athleteId = "athlete-1";

    const athleteRepository = {
        findById: vi.fn(),
    } as any;

    const digitalTwinRepository = {
        findById: vi.fn(),
        findByAthleteId: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates a Digital Twin only when the Athlete exists", async () => {

        athleteRepository.findById.mockResolvedValue({
            id: athleteId,
            tenantId,
        });

        digitalTwinRepository.findByAthleteId.mockResolvedValue(null);

        digitalTwinRepository.create.mockImplementation(
            async (twin: AthleteDigitalTwin) => twin,
        );

        const useCase =
            new CreateAthleteDigitalTwinUseCase(
                digitalTwinRepository,
                athleteRepository,
            );

        const result =
            await useCase.execute(
                new CreateAthleteDigitalTwinCommand(
                    tenantId,
                    athleteId,
                ),
            );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.athleteId).toBe(athleteId);
        expect(result.value?.tenantId).toBe(tenantId);
        expect(result.value?.status).toBe(RecordStatus.ACTIVE);

        expect(
            digitalTwinRepository.create,
        ).toHaveBeenCalledTimes(1);
    });

    it("rejects creation when the Digital Twin already exists", async () => {

        athleteRepository.findById.mockResolvedValue({
            id: athleteId,
            tenantId,
        });

        const existing =
            AthleteDigitalTwin.create(
                tenantId,
                athleteId,
            );

        digitalTwinRepository.findByAthleteId.mockResolvedValue(
            existing,
        );

        const useCase =
            new CreateAthleteDigitalTwinUseCase(
                digitalTwinRepository,
                athleteRepository,
            );

        const result =
            await useCase.execute(
                new CreateAthleteDigitalTwinCommand(
                    tenantId,
                    athleteId,
                ),
            );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete Digital Twin already exists.",
        );

        expect(
            digitalTwinRepository.create,
        ).not.toHaveBeenCalled();
    });

    it("rejects creation when the Athlete does not exist in the tenant", async () => {

        athleteRepository.findById.mockResolvedValue(null);

        const useCase =
            new CreateAthleteDigitalTwinUseCase(
                digitalTwinRepository,
                athleteRepository,
            );

        const result =
            await useCase.execute(
                new CreateAthleteDigitalTwinCommand(
                    tenantId,
                    athleteId,
                ),
            );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete not found.",
        );

        expect(
            digitalTwinRepository.findByAthleteId,
        ).not.toHaveBeenCalled();

        expect(
            digitalTwinRepository.create,
        ).not.toHaveBeenCalled();
    });

    it("reads a Digital Twin through tenant-scoped ID lookup", async () => {

        const twin =
            AthleteDigitalTwin.create(
                tenantId,
                athleteId,
            );

        digitalTwinRepository.findById.mockResolvedValue(
            twin,
        );

        const useCase =
            new GetAthleteDigitalTwinByIdUseCase(
                digitalTwinRepository,
            );

        const result =
            await useCase.execute(
                new GetAthleteDigitalTwinByIdQuery(
                    twin.id,
                    tenantId,
                ),
            );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.id).toBe(twin.id);

        expect(
            digitalTwinRepository.findById,
        ).toHaveBeenCalledWith(
            twin.id,
            tenantId,
        );
    });

    it("reads a Digital Twin through tenant-scoped Athlete lookup", async () => {

        const twin =
            AthleteDigitalTwin.create(
                tenantId,
                athleteId,
            );

        digitalTwinRepository.findByAthleteId.mockResolvedValue(
            twin,
        );

        const useCase =
            new GetAthleteDigitalTwinByAthleteIdUseCase(
                digitalTwinRepository,
            );

        const result =
            await useCase.execute(
                new GetAthleteDigitalTwinByAthleteIdQuery(
                    athleteId,
                    tenantId,
                ),
            );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.athleteId).toBe(athleteId);

        expect(
            digitalTwinRepository.findByAthleteId,
        ).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );
    });

    it("persists Digital Twin lifecycle changes", async () => {

        const twin =
            AthleteDigitalTwin.create(
                tenantId,
                athleteId,
            );

        digitalTwinRepository.findById.mockResolvedValue(
            twin,
        );

        digitalTwinRepository.update.mockImplementation(
            async (updatedTwin: AthleteDigitalTwin) =>
                updatedTwin,
        );

        const useCase =
            new UpdateAthleteDigitalTwinLifecycleUseCase(
                digitalTwinRepository,
            );

        const result =
            await useCase.execute(
                new UpdateAthleteDigitalTwinLifecycleCommand(
                    twin.id,
                    tenantId,
                    "SUSPEND",
                ),
            );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe(
            RecordStatus.SUSPENDED,
        );

        expect(
            digitalTwinRepository.update,
        ).toHaveBeenCalledWith(
            twin,
            tenantId,
        );
    });

    it("fails when the Digital Twin does not exist", async () => {

        digitalTwinRepository.findById.mockResolvedValue(null);

        const useCase =
            new UpdateAthleteDigitalTwinLifecycleUseCase(
                digitalTwinRepository,
            );

        const result =
            await useCase.execute(
                new UpdateAthleteDigitalTwinLifecycleCommand(
                    "missing-id",
                    tenantId,
                    "ACTIVATE",
                ),
            );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete Digital Twin not found.",
        );

        expect(
            digitalTwinRepository.update,
        ).not.toHaveBeenCalled();
    });

});
