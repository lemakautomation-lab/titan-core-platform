import { randomUUID } from "crypto";
import { RecordStatus } from "../enums/record-status.enum";

export class CoachSquad {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly coachUserId: string,
        public name: string,
        public description: string | null,
        public status: RecordStatus,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        coachUserId: string,
        name: string,
        description: string | null,
        now: Date = new Date(),
    ): CoachSquad {
        const squad = new CoachSquad(
            randomUUID(),
            tenantId,
            coachUserId,
            "",
            null,
            RecordStatus.ACTIVE,
            now,
            now,
        );

        squad.updateDetails(name, description, now);
        return squad;
    }

    updateDetails(
        name: string,
        description: string | null,
        now: Date = new Date(),
    ): void {
        const cleanedName = name.trim();

        if (cleanedName.length === 0 || cleanedName.length > 120) {
            throw new Error("Squad name is invalid.");
        }

        const cleanedDescription =
            description === null ? null : description.trim();

        if (
            cleanedDescription !== null &&
            cleanedDescription.length > 1000
        ) {
            throw new Error("Squad description exceeds maximum length.");
        }

        this.name = cleanedName;
        this.description =
            cleanedDescription === "" ? null : cleanedDescription;
        this.updatedAt = new Date(now);
    }
}
