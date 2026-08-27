import { AthleteDigitalTwin } from "../entities/athlete-digital-twin.entity";

export interface AthleteDigitalTwinRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<AthleteDigitalTwin | null>;

    findByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<AthleteDigitalTwin | null>;

    create(
        twin: AthleteDigitalTwin,
    ): Promise<AthleteDigitalTwin>;

    update(
        twin: AthleteDigitalTwin,
        tenantId: string,
    ): Promise<AthleteDigitalTwin>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

}
