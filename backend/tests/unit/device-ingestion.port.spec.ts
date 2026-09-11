import { DeviceIngestionPort } from "../../src/domain/ports/device/device-ingestion.port";

type TestPayload = {
    observedAt: string;
    value: number;
};

type TestResult = {
    accepted: boolean;
};

describe("DeviceIngestionPort", () => {
    it("supports a provider-neutral ingestion boundary", async () => {
        const payload: TestPayload = {
            observedAt: "2026-09-11T16:00:00.000Z",
            value: 72,
        };

        const port: DeviceIngestionPort<TestPayload, TestResult> = {
            async ingest(deviceId, receivedPayload) {
                expect(deviceId).toBe("device-001");
                expect(receivedPayload).toEqual(payload);

                return { accepted: true };
            },
        };

        await expect(
            port.ingest("device-001", payload),
        ).resolves.toEqual({ accepted: true });
    });
});
