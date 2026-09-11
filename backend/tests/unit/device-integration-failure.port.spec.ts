import {
    DeviceIntegrationFailure,
    DeviceIntegrationFailurePort,
} from "../../src/domain/ports/device/device-integration-failure.port";

describe("DeviceIntegrationFailurePort", () => {
    it("supports provider-independent integration failure handling", async () => {
        const failure: DeviceIntegrationFailure = {
            code: "DEVICE_UNAVAILABLE",
            message: "Device integration unavailable.",
        };

        const handled: DeviceIntegrationFailure[] = [];

        const port: DeviceIntegrationFailurePort = {
            async handleFailure(receivedFailure) {
                handled.push(receivedFailure);
            },
        };

        await expect(port.handleFailure(failure)).resolves.toBeUndefined();
        expect(handled).toEqual([failure]);
    });
});
