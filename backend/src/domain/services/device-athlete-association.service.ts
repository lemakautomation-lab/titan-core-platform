import { AthleteRepository } from "../repositories/athlete.repository";
import { Device } from "../entities/device/device.entity";

export class DeviceAthleteAssociationService {

    constructor(
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async associate(
        device: Device,
        athleteId: string,
    ): Promise<void> {

        const athlete =
            await this.athleteRepository.findById(
                athleteId,
                device.tenantId,
            );

        if (!athlete) {
            throw new Error("Athlete not found.");
        }

        if (!athlete.isActive()) {
            throw new Error("Athlete is not active.");
        }

        device.associateWithAthlete(athlete.id);
    }
}
