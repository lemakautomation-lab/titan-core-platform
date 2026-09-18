import { TrainerProfile } from "../entities/trainer-profile.entity";

export interface TrainerProfileRepository {

    findByUserId(
        userId: string,
        tenantId: string,
    ): Promise<TrainerProfile | null>;

    create(
        profile: TrainerProfile,
    ): Promise<TrainerProfile>;

    update(
        profile: TrainerProfile,
    ): Promise<TrainerProfile>;

}
