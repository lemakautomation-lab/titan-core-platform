import { SessionStatus } from "../enums/session-status.enum";

export class Session {

    constructor(

        public readonly id: string,

        public readonly userId: string,

        public refreshToken: string,

        public status: SessionStatus,

        public expiresAt: Date,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    revoke(): void {
        this.status = SessionStatus.REVOKED;
    }

    isActive(): boolean {
        return this.status === SessionStatus.ACTIVE;
    }

    isExpired(): boolean {
        return this.expiresAt.getTime() <= Date.now();
    }

}