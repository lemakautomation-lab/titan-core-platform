import { createHash, randomBytes } from "node:crypto";

import { DatabaseService } from "../database/database.service";

export interface OrganisationVerificationEmailDelivery {
    deliver(input: Readonly<{
        recipientEmail: string;
        verificationUrl: string;
        expiresAt: Date;
    }>): Promise<void>;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TOKEN_TTL_MS = 30 * 60_000;

function hash(rawToken: string): string {
    if (!TOKEN_PATTERN.test(rawToken)) {
        throw new Error("Verification token is invalid or expired.");
    }
    return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export class OrganisationEmailVerificationService {
    constructor(
        private readonly database: DatabaseService,
        private readonly delivery: OrganisationVerificationEmailDelivery,
        private readonly frontendOrigin: string,
    ) {}

    async issue(applicationId: string): Promise<void> {
        const application = await this.database.prisma.organisationOnboardingApplication.findUnique({
            where: { id: applicationId },
        });
        if (!application || application.status !== "PENDING_VERIFICATION" ||
            application.expiresAt.getTime() <= Date.now()) {
            throw new Error("Organisation application is not awaiting email verification.");
        }
        const rawToken = randomBytes(32).toString("base64url");
        const issuedAt = new Date();
        const expiresAt = new Date(Math.min(
            issuedAt.getTime() + TOKEN_TTL_MS,
            application.expiresAt.getTime(),
        ));
        const token = await this.database.transaction(async tx => {
            const locked = await tx.organisationOnboardingApplication.updateMany({
                where: {
                    id: applicationId,
                    status: "PENDING_VERIFICATION",
                    expiresAt: { gt: issuedAt },
                },
                data: { status: "PENDING_VERIFICATION" },
            });
            if (locked.count !== 1) {
                throw new Error("Organisation application is not awaiting email verification.");
            }
            await tx.organisationOnboardingEmailVerificationToken.updateMany({
                where: { applicationId, consumedAt: null, revokedAt: null },
                data: { revokedAt: issuedAt },
            });
            return tx.organisationOnboardingEmailVerificationToken.create({
                data: { applicationId, tokenHash: hash(rawToken), expiresAt },
            });
        });
        const url = new URL("/verify-organisation-email", this.frontendOrigin);
        url.searchParams.set("token", rawToken);
        try {
            await this.delivery.deliver({
                recipientEmail: application.administratorEmail,
                verificationUrl: url.toString(),
                expiresAt,
            });
        } catch {
            await this.database.prisma.organisationOnboardingEmailVerificationToken.updateMany({
                where: { id: token.id, consumedAt: null },
                data: { revokedAt: new Date() },
            });
            throw new Error("Organisation verification email could not be delivered.");
        }
    }

    async verify(rawToken: string): Promise<{ applicationId: string; status: "PENDING_PAYMENT" }> {
        let tokenHash: string;
        try {
            tokenHash = hash(rawToken);
        } catch {
            throw new Error("Verification token is invalid or expired.");
        }
        return this.database.transaction(async tx => {
            const token = await tx.organisationOnboardingEmailVerificationToken.findUnique({
                where: { tokenHash }, include: { application: true },
            });
            const now = new Date();
            if (!token || token.consumedAt || token.revokedAt ||
                token.expiresAt.getTime() <= now.getTime() ||
                token.application.expiresAt.getTime() <= now.getTime() ||
                token.application.status !== "PENDING_VERIFICATION") {
                throw new Error("Verification token is invalid or expired.");
            }
            const claimed = await tx.organisationOnboardingEmailVerificationToken.updateMany({
                where: { id: token.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
                data: { consumedAt: now },
            });
            if (claimed.count !== 1) {
                throw new Error("Verification token is invalid or expired.");
            }
            const advanced = await tx.organisationOnboardingApplication.updateMany({
                where: { id: token.applicationId, status: "PENDING_VERIFICATION", expiresAt: { gt: now } },
                data: { status: "PENDING_PAYMENT" },
            });
            if (advanced.count !== 1) {
                throw new Error("Verification token is invalid or expired.");
            }
            return { applicationId: token.applicationId, status: "PENDING_PAYMENT" as const };
        });
    }
}
