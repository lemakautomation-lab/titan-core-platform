import { DatabaseService } from "../database/database.service";

export interface OrganisationRegistrationInput {
    requestId: string;
    organisationName: string;
    administratorEmail: string;
    planId: string;
}

/** Internal boundary: verify email ownership and payment before provisioning. */
export class OrganisationRegistrationService {
    constructor(private readonly database: DatabaseService) {}

    async prepare(input: OrganisationRegistrationInput) {
        if(!input || typeof input.requestId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) {
            throw new Error("A valid registration request ID is required.");
        }
        const name = typeof input.organisationName === "string"
            ? input.organisationName.trim().replace(/\s+/g, " ") : "";
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const email = typeof input.administratorEmail === "string"
            ? input.administratorEmail.trim().toLowerCase() : "";
        if(name.length < 2 || name.length > 120 || slug.length < 3 || slug.length > 64 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
            typeof input.planId !== "string" || !input.planId.trim()) {
            throw new Error("Organisation registration details are invalid.");
        }
        const existing = await this.database.prisma.organisationOnboardingApplication.findUnique({
            where: {requestId: input.requestId},
        });
        const matches = (record: {
            organisationName: string; administratorEmail: string; planId: string;
        }) => record.organisationName === name && record.administratorEmail === email &&
            record.planId === input.planId;
        if(existing) {
            if(!matches(existing)) throw new Error("Registration request ID was already used.");
            return existing;
        }
        const plan = await this.database.prisma.organisationOnboardingPlan.findUnique({
            where: {id: input.planId},
        });
        if(!plan || plan.status !== "ACTIVE" || !Number.isSafeInteger(plan.amountMinor) ||
            plan.amountMinor <= 0 || !/^[A-Z]{3}$/.test(plan.currency) ||
            !["MONTHLY", "ANNUALLY"].includes(plan.billingInterval)) {
            throw new Error("The selected organisation plan is unavailable.");
        }
        try {
            return await this.database.prisma.organisationOnboardingApplication.create({
                data: {
                    requestId: input.requestId, organisationName: name, organisationSlug: slug,
                    administratorEmail: email, planId: plan.id, amountMinor: plan.amountMinor,
                    currency: plan.currency, billingInterval: plan.billingInterval,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
        } catch(error) {
            if(error && typeof error === "object" && "code" in error && error.code === "P2002") {
                const concurrent = await this.database.prisma.organisationOnboardingApplication.findUnique({
                    where: {requestId: input.requestId},
                });
                if(concurrent && matches(concurrent)) return concurrent;
                throw new Error("Registration request ID was already used.");
            }
            throw error;
        }
    }
}
