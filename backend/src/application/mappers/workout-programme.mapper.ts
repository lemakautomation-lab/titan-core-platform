import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";

import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";

export class WorkoutProgrammeApplicationMapper {

    static toDto(
        programme: WorkoutProgramme,
    ): WorkoutProgrammeDto {

        return new WorkoutProgrammeDto(

            programme.id,

            programme.tenantId,

            programme.athleteId,

            programme.name,

            programme.description,

            programme.goal,

            programme.experience,

            programme.trainingFrequency,

            programme.sessionDurationMinutes,

            programme.sportId,

            programme.status,

            programme.createdAt,

            programme.updatedAt,

        );

    }

}
