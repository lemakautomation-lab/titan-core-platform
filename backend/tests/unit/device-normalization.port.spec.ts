import { DeviceNormalizationPort } from "../../src/domain/ports/device/device-normalization.port";

type TestInput = {
    observedAt: string;
    value: number;
};

type TestOutput = {
    recordedAt: string;
    value: number;
};

describe("DeviceNormalizationPort", () => {
    it("supports a provider-independent normalization boundary", async () => {
        const input: TestInput = {
            observedAt: "2026-09-11T16:00:00.000Z",
            value: 72,
        };

        const port: DeviceNormalizationPort<TestInput, TestOutput> = {
            async normalize(receivedInput) {
                expect(receivedInput).toEqual(input);

                return {
                    recordedAt: receivedInput.observedAt,
                    value: receivedInput.value,
                };
            },
        };

        await expect(port.normalize(input)).resolves.toEqual({
            recordedAt: "2026-09-11T16:00:00.000Z",
            value: 72,
        });
    });
});
