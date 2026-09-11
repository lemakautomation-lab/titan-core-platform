import { randomUUID } from "crypto";

export class Device {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly deviceId: string,
        public readonly deviceType: string,
        public athleteId: string | null,
        public readonly createdAt: Date,
    ) {}

    static create(
        tenantId: string,
        deviceId: string,
        deviceType: string,
        athleteId: string | null = null,
    ): Device {
        if (!tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!deviceId?.trim()) {
            throw new Error("Device ID is required.");
        }

        if (!deviceType?.trim()) {
            throw new Error("Device type is required.");
        }

        return new Device(
            randomUUID(),
            tenantId.trim(),
            deviceId.trim(),
            deviceType.trim(),
            athleteId?.trim() || null,
            new Date(),
        );
    }

    associateWithAthlete(athleteId: string): void {
        if (!athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        this.athleteId = athleteId.trim();
    }
}