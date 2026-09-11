import { WearableDevicePort } from "../../src/domain/ports/device/wearable-device.port";

type TestDevice = {
    id: string;
};

describe("WearableDevicePort", () => {
    it("supports a provider-neutral device lookup contract", async () => {
        const device: TestDevice = { id: "device-001" };

        const port: WearableDevicePort<TestDevice> = {
            async getDevice(deviceId: string) {
                return deviceId === device.id ? device : null;
            },
        };

        await expect(port.getDevice("device-001")).resolves.toEqual(device);
        await expect(port.getDevice("unknown")).resolves.toBeNull();
    });
});
