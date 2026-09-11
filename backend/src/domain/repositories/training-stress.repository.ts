import { TrainingStress } from "../entities/training-stress.entity";
export interface TrainingStressRepository {
    createIdempotently(tracking:TrainingStress):Promise<
        |{kind:"created";tracking:TrainingStress}
        |{kind:"replayed";tracking:TrainingStress}
        |{kind:"idempotency-conflict"}
    >;
    listRecentForAthlete(tenantId:string,athleteId:string,limit:number):Promise<TrainingStress[]>;
}
