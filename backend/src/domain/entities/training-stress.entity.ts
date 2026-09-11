import { randomUUID } from "crypto";

export class TrainingStress {
    constructor(
        public readonly id:string, public readonly tenantId:string, public readonly athleteId:string,
        public readonly value:number, public readonly recordedAt:Date, public readonly createdAt:Date,
        public readonly sourceType:string, public readonly sourceId:string, public readonly sourceObservationId:string,
    ) {}
    static create(tenantId:string, athleteId:string, value:number, recordedAt?:Date, sourceType?:string, sourceId?:string, sourceObservationId?:string):TrainingStress {
        if(!tenantId?.trim()) throw new Error("Tenant ID is required.");
        if(!athleteId?.trim()) throw new Error("Athlete ID is required.");
        if(typeof value!=="number" || !Number.isFinite(value)) throw new Error("Training stress value must be finite.");
        const date=recordedAt??new Date();
        if(Number.isNaN(date.getTime())) throw new Error("Training stress date is invalid.");
        if([sourceType,sourceId,sourceObservationId].some(v=>!v?.trim())) throw new Error("Complete training stress provenance is required.");
        return new TrainingStress(randomUUID(),tenantId.trim(),athleteId.trim(),value,date,new Date(),sourceType!.trim(),sourceId!.trim(),sourceObservationId!.trim());
    }
}
