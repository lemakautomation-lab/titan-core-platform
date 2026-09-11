import { Device } from "../../src/domain/entities/device/device.entity";

describe("Device", () => {
    it("creates a provider-independent tenant-scoped device", () => {
        const device = Device.create(
            "tenant-001",
            "external-device-001",
            "wearable",
        );

        expect(device.id).toEqual(expect.any(String));
        expect(device.tenantId).toBe("tenant-001");
        expect(device.deviceId).toBe("external-device-001");
        expect(device.deviceType).toBe("wearable");
        expect(device.createdAt).toEqual(expect.any(Date));
    });

    it("rejects missing required identity fields", () => {
        expect(() => Device.create("", "device-001", "wearable"))
            .toThrow("Tenant ID is required.");

        expect(() => Device.create("tenant-001", "", "wearable"))
            .toThrow("Device ID is required.");

        expect(() => Device.create("tenant-001", "device-001", ""))
            .toThrow("Device type is required.");
    });

    it("trims canonical identity fields", () => {
        const device = Device.create(
            " tenant-001 ",
            " external-device-001 ",
            " wearable ",
        );

        expect(device.tenantId).toBe("tenant-001");
        expect(device.deviceId).toBe("external-device-001");
        expect(device.deviceType).toBe("wearable");
    });
});
