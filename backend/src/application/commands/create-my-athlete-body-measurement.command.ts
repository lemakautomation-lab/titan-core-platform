export class CreateMyAthleteBodyMeasurementCommand {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly heightCm: unknown,
        public readonly weightKg: unknown,
        public readonly bodyFatPercentage: unknown,
        public readonly recordedAt: unknown,
    ) {}
}