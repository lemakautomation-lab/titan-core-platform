import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteDigitalTwinRepository } from "../../domain/repositories/athlete-digital-twin.repository";

import { AthleteDigitalTwinDto } from "../dto/athlete-digital-twin/athlete-digital-twin.dto";
import { AthleteDigitalTwinApplicationMapper } from "../mappers/athlete-digital-twin.mapper";

import { UpdateAthleteDigitalTwinLifecycleCommand } from "../commands/update-athlete-digital-twin-lifecycle.command";

export class UpdateAthleteDigitalTwinLifecycleUseCase
implements UseCase<
    UpdateAthleteDigitalTwinLifecycleCommand,
    Result<AthleteDigitalTwinDto>
> {

    constructor(
        private readonly athleteDigitalTwinRepository: AthleteDigitalTwinRepository,
    ) {}

    async execute(
        command: UpdateAthleteDigitalTwinLifecycleCommand,
    ): Promise<Result<AthleteDigitalTwinDto>> {

        const twin =
            await this.athleteDigitalTwinRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!twin) {

            return Result.failure(
                "Athlete Digital Twin not found.",
            );
        }

        switch (command.action) {

            case "ACTIVATE":
                twin.activate();
                break;

            case "DEACTIVATE":
                twin.deactivate();
                break;

            case "SUSPEND":
                twin.suspend();
                break;

            case "DELETE":
                twin.delete();
                break;

        }

        const updated =
            await this.athleteDigitalTwinRepository.update(
                twin,
                command.tenantId,
            );

        return Result.success(
            AthleteDigitalTwinApplicationMapper.toDto(
                updated,
            ),
        );
    }

}
