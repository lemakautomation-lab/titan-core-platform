import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { OrganisationProvisioningService } from "../../src/infrastructure/onboarding/organisation-provisioning.service";
import { OrganisationAdministratorSetupService } from "../../src/infrastructure/onboarding/organisation-administrator-setup.service";
import { testPrisma } from "../helpers/prisma-test.client";

const applications: string[] = [];
const plans: string[] = [];
const tenants: string[] = [];
const emails: string[] = [];
const service = new OrganisationAdministratorSetupService(
    new DatabaseService(),
    { async deliver(message) { emails.push(message.setupUrl); } },
    "https://app.titan-tech.co.za",
);
const provisioning = new OrganisationProvisioningService(new DatabaseService());

async function createApplication(verifiedPayment = true) {
    const plan = await testPrisma.organisationOnboardingPlan.create({
        data: { code: `setup-${randomUUID()}`, name: "Setup plan", amountMinor: 59900,
            currency: "ZAR", billingInterval: "MONTHLY" },
    });
    plans.push(plan.id);
    const application = await testPrisma.organisationOnboardingApplication.create({
        data: { requestId: randomUUID(), organisationName: "Setup organisation",
            organisationSlug: `setup-${randomUUID()}`, administratorEmail: `admin-${randomUUID()}@example.test`,
            planId: plan.id, amountMinor: 59900, currency: "ZAR", billingInterval: "MONTHLY",
            status: "PAYMENT_CONFIRMED", expiresAt: new Date(Date.now() + 3600_000) },
    });
    applications.push(application.id);
    await testPrisma.organisationOnboardingPaymentAttempt.create({
        data: { applicationId: application.id, requestId: randomUUID(), provider: "FAKE",
            amountMinor: verifiedPayment ? 59900 : 59901, currency: "ZAR",
            billingInterval: "MONTHLY", status: "CONFIRMED",
            providerSessionReference: `session-${randomUUID()}`,
            providerTransactionReference: `transaction-${randomUUID()}`, confirmedAt: new Date() },
    });
    return application;
}

function tokenFromLastEmail() {
    return new URL(emails.at(-1)!).searchParams.get("token")!;
}

afterAll(async () => {
    await testPrisma.organisationAdministratorSetupToken.deleteMany({ where: { applicationId: { in: applications } } });
    await testPrisma.rolePermission.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.userRole.deleteMany({ where: { user: { tenantId: { in: tenants } } } });
    await testPrisma.role.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.permission.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.user.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.organisation.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.organisationOnboardingPaymentAttempt.deleteMany({ where: { applicationId: { in: applications } } });
    await testPrisma.organisationOnboardingApplication.deleteMany({ where: { id: { in: applications } } });
    await testPrisma.tenant.deleteMany({ where: { id: { in: tenants } } });
    await testPrisma.organisationOnboardingPlan.deleteMany({ where: { id: { in: plans } } });
});

describe("Mission 111 administrator setup and paid activation", () => {
    it("emails only the verified administrator, consumes one token, and activates paid provisioned records", async () => {
        const application = await createApplication();
        const provisioned = await provisioning.provision(application.id);
        tenants.push(provisioned.tenantId);
        const role = await testPrisma.role.findFirstOrThrow({
            where: { tenantId: provisioned.tenantId, name: "Organisation Administrator" },
        });
        const permission = await testPrisma.permission.findUniqueOrThrow({
            where: { tenantId_code: { tenantId: provisioned.tenantId, code: "organisations.read" } },
        });
        await testPrisma.rolePermission.delete({
            where: { tenantId_roleId_permissionId: {
                tenantId: provisioned.tenantId, roleId: role.id, permissionId: permission.id,
            } },
        });
        await service.request(application.id, application.administratorEmail);
        const unprivilegedToken = tokenFromLastEmail();
        await expect(service.complete(unprivilegedToken, "SecurePassword123!")).rejects.toThrow();
        expect((await testPrisma.tenant.findUniqueOrThrow({ where: { id: provisioned.tenantId } })).status).toBe("INACTIVE");
        await testPrisma.rolePermission.create({
            data: { tenantId: provisioned.tenantId, roleId: role.id, permissionId: permission.id },
        });
        const before = emails.length;
        await service.request(application.id, "attacker@example.test");
        expect(emails).toHaveLength(before);
        await service.request(application.id, application.administratorEmail);
        const first = tokenFromLastEmail();
        await service.request(application.id, application.administratorEmail);
        const second = tokenFromLastEmail();
        await expect(service.complete(first, "SecurePassword123!")).rejects.toThrow();
        expect(await service.complete(second, "SecurePassword123!")).toEqual({ status: "ACTIVE" });
        await expect(service.complete(second, "SecurePassword123!")).rejects.toThrow();
        expect((await testPrisma.tenant.findUniqueOrThrow({ where: { id: provisioned.tenantId } })).status).toBe("ACTIVE");
        expect((await testPrisma.organisation.findUniqueOrThrow({ where: { id: provisioned.organisationId } })).status).toBe("ACTIVE");
        expect((await testPrisma.user.findUniqueOrThrow({ where: { id: provisioned.administratorId } })).status).toBe("ACTIVE");
    }, 30000);

    it("does not issue a token before provisioning and rejects payment snapshot drift", async () => {
        const application = await createApplication();
        const before = emails.length;
        await service.request(application.id, application.administratorEmail);
        expect(emails).toHaveLength(before);
        const provisioned = await provisioning.provision(application.id);
        tenants.push(provisioned.tenantId);
        await testPrisma.organisationOnboardingPaymentAttempt.updateMany({
            where: { applicationId: application.id }, data: { amountMinor: 59901 },
        });
        await service.request(application.id, application.administratorEmail);
        expect(emails).toHaveLength(before);
        expect((await testPrisma.tenant.findUniqueOrThrow({ where: { id: provisioned.tenantId } })).status).toBe("INACTIVE");
    }, 30000);
});
