import { DeviceAthleteAssociationService } from "../../src/domain/services/device-athlete-association.service";
import { Device } from "../../src/domain/entities/device/device.entity";
import { Athlete } from "../../src/domain/entities/athlete.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";

describe("DeviceAthleteAssociationService", () => {

    const device = Device.create(
        "tenant-001",
        "device-001",
        "wearable",
    );

    const activeAthlete = new Athlete(
        "athlete-001",
        "tenant-001",
        null,
        null,
        "Test",
        "Athlete",
        null,
        RecordStatus.ACTIVE,
        new Date(),
        new Date(),
    );

    it("associates only a tenant-owned active athlete", async () => {
        const repository: AthleteRepository = {
            findById: async (id, tenantId) => {
                expect(id).toBe("athlete-001");
                expect(tenantId).toBe("tenant-001");
                return activeAthlete;
            },
            findAll: async () => [],
            findAllByOrganisationId: async () => [],
            findByUserId: async () => null,
            create: async (athlete) => athlete,
            update: async (athlete) => athlete,
            delete: async () => undefined,
        };

        const service =
            new DeviceAthleteAssociationService(repository);

        await service.associate(device, "athlete-001");

        expect(device.athleteId).toBe("athlete-001");
    });

    it("rejects an athlete outside the device tenant", async () => {
        const repository: AthleteRepository = {
            findById: async (_id, tenantId) => {
                expect(tenantId).toBe("tenant-001");
                return null;
            },
            findAll: async () => [],
            findAllByOrganisationId: async () => [],
            findByUserId: async () => null,
            create: async (athlete) => athlete,
            update: async (athlete) => athlete,
            delete: async () => undefined,
        };

        const service =
            new DeviceAthleteAssociationService(repository);

        await expect(
            service.associate(device, "athlete-other-tenant"),
        ).rejects.toThrow("Athlete not found.");
    });

    it("rejects an inactive tenant-owned athlete", async () => {
        const inactiveAthlete = new Athlete(
            "athlete-002",
            "tenant-001",
            null,
            null,
            "Inactive",
            "Athlete",
            null,
            RecordStatus.INACTIVE,
            new Date(),
            new Date(),
        );

        const repository: AthleteRepository = {
            findById: async () => inactiveAthlete,
            findAll: async () => [],
            findAllByOrganisationId: async () => [],
            findByUserId: async () => null,
            create: async (athlete) => athlete,
            update: async (athlete) => athlete,
            delete: async () => undefined,
        };

        const service =
            new DeviceAthleteAssociationService(repository);

        await expect(
            service.associate(device, "athlete-002"),
        ).rejects.toThrow("Athlete is not active.");
    });
});
