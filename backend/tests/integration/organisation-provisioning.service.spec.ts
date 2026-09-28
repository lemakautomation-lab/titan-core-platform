import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { OrganisationProvisioningService } from "../../src/infrastructure/onboarding/organisation-provisioning.service";
import { VerifiedOrganisationPaymentEventService } from "../../src/infrastructure/onboarding/verified-organisation-payment-event.service";
import { testPrisma } from "../helpers/prisma-test.client";

const service = new OrganisationProvisioningService(new DatabaseService());
const applications: string[] = [];
const plans: string[] = [];
const tenants: string[] = [];

async function application(withPayment = true, slug = `provision-${randomUUID()}`) {
    const plan = await testPrisma.organisationOnboardingPlan.create({
        data: {
            code: `provision-${randomUUID()}`,
            name: "Provisioning test plan",
            amountMinor: 59900,
            currency: "ZAR",
            billingInterval: "MONTHLY",
        },
    });
    plans.push(plan.id);
    const row = await testPrisma.organisationOnboardingApplication.create({
        data: {
            requestId: randomUUID(),
            organisationName: "Provisioning test organisation",
            organisationSlug: slug,
            administratorEmail: `admin-${randomUUID()}@example.test`,
            planId: plan.id,
            amountMinor: 59900,
            currency: "ZAR",
            billingInterval: "MONTHLY",
            status: "PAYMENT_CONFIRMED",
            expiresAt: new Date(Date.now() + 3600000),
        },
    });
    applications.push(row.id);
    if (withPayment) {
        await testPrisma.organisationOnboardingPaymentAttempt.create({
            data: {
                applicationId: row.id,
                requestId: randomUUID(),
                provider: "FAKE",
                amountMinor: 59900,
                currency: "ZAR",
                billingInterval: "MONTHLY",
                status: "CONFIRMED",
                providerSessionReference: `session-${randomUUID()}`,
                providerTransactionReference: `transaction-${randomUUID()}`,
                confirmedAt: new Date(),
            },
        });
    }
    return row;
}

afterAll(async () => {
    await testPrisma.userRole.deleteMany({ where: { user: { tenantId: { in: tenants } } } });
    await testPrisma.role.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.user.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.organisation.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.organisationOnboardingPaymentAttempt.deleteMany({ where: { applicationId: { in: applications } } });
    await testPrisma.organisationOnboardingApplication.deleteMany({ where: { id: { in: applications } } });
    await testPrisma.tenant.deleteMany({ where: { id: { in: tenants } } });
    await testPrisma.organisationOnboardingPlan.deleteMany({ where: { id: { in: plans } } });
});

describe("Organisation provisioning after verified payment", () => {
    it("atomically provisions inactive records with a tenant-scoped administrator role and replays idempotently", async () => {
        const row = await application();
        const first = await service.provision(row.id);
        tenants.push(first.tenantId);
        expect(await service.provision(row.id)).toEqual(first);
        const saved = await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({ where: { id: row.id } });
        expect(saved).toMatchObject({
            status: "PROVISIONED",
            provisionedTenantId: first.tenantId,
            provisionedOrganisationId: first.organisationId,
            provisionedAdministratorId: first.administratorId,
        });
        expect(saved.provisionedPaymentAttemptId).toBeTruthy();
        const payment = await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
            where: { id: saved.provisionedPaymentAttemptId! },
        });
        const webhook = new VerifiedOrganisationPaymentEventService(
            new DatabaseService(),
            { verify: async () => ({
                provider: payment.provider,
                attemptId: payment.id,
                providerSessionReference: payment.providerSessionReference!,
                providerTransactionReference: payment.providerTransactionReference!,
                amountMinor: payment.amountMinor,
                currency: payment.currency,
                billingInterval: "MONTHLY",
                outcome: "CONFIRMED",
            }) },
        );
        expect((await webhook.process(new Uint8Array([1]), "signed")).status).toBe("PROVISIONED");
        expect(await testPrisma.tenant.findUniqueOrThrow({ where: { id: first.tenantId } })).toMatchObject({ status: "INACTIVE" });
        expect(await testPrisma.organisation.findUniqueOrThrow({ where: { id: first.organisationId } })).toMatchObject({ tenantId: first.tenantId, status: "INACTIVE" });
        expect(await testPrisma.user.findUniqueOrThrow({
            where: { id: first.administratorId }, include: { userRoles: { include: { role: true } } },
        })).toMatchObject({
            tenantId: first.tenantId, organisationId: first.organisationId,
            status: "INACTIVE",
            userRoles: [{ role: { tenantId: first.tenantId, name: "Organisation Administrator" } }],
        });
    }, 30000);

    it("rolls back the state claim when no matching confirmed payment exists", async () => {
        const row = await application(false);
        await expect(service.provision(row.id)).rejects.toThrow("matching verified payment");
        expect((await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({ where: { id: row.id } })).status)
            .toBe("PAYMENT_CONFIRMED");
        expect(await testPrisma.tenant.findUnique({ where: { slug: row.organisationSlug } })).toBeNull();
    }, 30000);

    it("rolls back the state claim on tenant slug conflict", async () => {
        const first = await application();
        const provisioned = await service.provision(first.id);
        tenants.push(provisioned.tenantId);
        const second = await application(true, first.organisationSlug);
        await expect(service.provision(second.id)).rejects.toThrow();
        expect((await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({ where: { id: second.id } })).status)
            .toBe("PAYMENT_CONFIRMED");
        expect(await testPrisma.tenant.count({ where: { slug: first.organisationSlug } })).toBe(1);
    }, 30000);
});
