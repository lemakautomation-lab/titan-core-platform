import { SessionStatus } from "../../../domain/enums/session-status.enum";

export class SessionDto {

    constructor(

        public readonly id: string,

        public readonly userId: string,

        public readonly status: SessionStatus,

        public readonly expiresAt: Date,

        public readonly createdAt: Date,

        public readonly updatedAt: Date,

    ) {}

}
