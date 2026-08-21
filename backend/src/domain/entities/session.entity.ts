import { randomUUID } from "crypto";

import { SessionStatus } from "../enums/session-status.enum";


export class Session {


    constructor(

        public readonly id: string,

        public readonly userId: string,

        public readonly jti: string,

        public refreshToken: string,

        public status: SessionStatus,

        public expiresAt: Date,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}


    static create(
        userId: string,
        jti: string,
        refreshToken: string,
        expiresAt: Date,
    ): Session {

        const now = new Date();

        return new Session(

            randomUUID(),

            userId,

            jti,

            refreshToken,

            SessionStatus.ACTIVE,

            expiresAt,

            now,

            now,

        );

    }


    revoke(): void {

        this.status = SessionStatus.REVOKED;

        this.updatedAt = new Date();

    }


    isActive(): boolean {

        return this.status === SessionStatus.ACTIVE;

    }


    isExpired(): boolean {

        return this.expiresAt.getTime() <= Date.now();

    }


}
